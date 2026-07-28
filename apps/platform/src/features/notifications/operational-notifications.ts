import "server-only";

import { hasPermission, Permissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import type { CurrentWorkspaceContext } from "@/lib/workspace-context";

export type OperationalNotification = {
  fingerprint: string;
  kind: "document" | "opportunity" | "contract" | "milestone" | "approval";
  severity: "danger" | "warning" | "info";
  title: string;
  description: string;
  href: string;
  dueAt: Date | null;
  read: boolean;
};

const day = 86_400_000;

export async function getOperationalNotifications(
  context: CurrentWorkspaceContext,
  userId: string,
) {
  const workspaceId = context.workspace.id;
  // Request time is intentionally used to generate current operational alerts.
  // eslint-disable-next-line react-hooks/purity
  const now = new Date();
  const inSevenDays = new Date(now.getTime() + 7 * day);
  const inThirtyDays = new Date(now.getTime() + 30 * day);
  const canReadDocuments =
    hasPermission(context, Permissions.workspace.read) ||
    hasPermission(context, Permissions.opportunities.read) ||
    hasPermission(context, Permissions.contracts.read) ||
    hasPermission(context, Permissions.procurement.read) ||
    hasPermission(context, Permissions.vendors.read);
  const canReadOpportunities = hasPermission(context, Permissions.opportunities.read);
  const canReadContracts = hasPermission(context, Permissions.contracts.read);
  const canReadProcurement = hasPermission(context, Permissions.procurement.read);

  const [documents, opportunities, contracts, milestones, procurementApprovals, opportunityApprovals, contractApprovals] =
    await Promise.all([
      canReadDocuments ? prisma.document.findMany({
        where: { workspaceId, deletedAt: null, expiresAt: { lte: inThirtyDays }, reviewStatus: { not: "ARCHIVED" } },
        select: { id: true, title: true, expiresAt: true },
      }) : Promise.resolve([]),
      canReadOpportunities ? prisma.opportunity.findMany({
        where: { workspaceId, closingDate: { lte: inSevenDays }, status: { notIn: ["CANCELLED", "CLOSED", "ARCHIVED", "AWARDED"] } },
        select: { id: true, number: true, title: true, closingDate: true },
      }) : Promise.resolve([]),
      canReadContracts ? prisma.contract.findMany({
        where: { workspaceId, endDate: { lte: inThirtyDays }, status: { in: ["ACTIVE", "SUSPENDED"] } },
        select: { id: true, number: true, title: true, endDate: true },
      }) : Promise.resolve([]),
      canReadContracts ? prisma.contractMilestone.findMany({
        where: { contract: { workspaceId }, dueDate: { lte: inSevenDays }, status: { not: "ACCEPTED" } },
        select: { id: true, title: true, dueDate: true, contract: { select: { id: true, number: true } } },
      }) : Promise.resolve([]),
      canReadProcurement ? prisma.procurementRequest.findMany({
        where: { workspaceId, status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
        select: { id: true, number: true, title: true, updatedAt: true },
      }) : Promise.resolve([]),
      canReadOpportunities ? prisma.opportunity.findMany({
        where: { workspaceId, status: { in: ["PENDING_APPROVAL", "AWARD_PENDING"] } },
        select: { id: true, number: true, title: true, updatedAt: true },
      }) : Promise.resolve([]),
      canReadContracts ? prisma.contract.findMany({
        where: { workspaceId, status: "PENDING_APPROVAL" },
        select: { id: true, number: true, title: true, updatedAt: true },
      }) : Promise.resolve([]),
    ]);

  const generated: Omit<OperationalNotification, "read">[] = [
    ...documents.map((item) => ({
      fingerprint: `document-expiry:${item.id}:${item.expiresAt!.toISOString().slice(0, 10)}`,
      kind: "document" as const,
      severity: item.expiresAt! < now ? "danger" as const : "warning" as const,
      title: item.expiresAt! < now ? "مستند منتهي الصلاحية" : "مستند يقترب من الانتهاء",
      description: item.title,
      href: "/platform/documents",
      dueAt: item.expiresAt,
    })),
    ...opportunities.map((item) => ({
      fingerprint: `opportunity-closing:${item.id}:${item.closingDate!.toISOString().slice(0, 10)}`,
      kind: "opportunity" as const,
      severity: item.closingDate! < now ? "danger" as const : "warning" as const,
      title: item.closingDate! < now ? "تجاوز موعد إغلاق المنافسة" : "منافسة تغلق قريبًا",
      description: `${item.number} — ${item.title}`,
      href: `/platform/opportunities/${item.id}`,
      dueAt: item.closingDate,
    })),
    ...contracts.map((item) => ({
      fingerprint: `contract-ending:${item.id}:${item.endDate!.toISOString().slice(0, 10)}`,
      kind: "contract" as const,
      severity: item.endDate! < now ? "danger" as const : "warning" as const,
      title: item.endDate! < now ? "عقد تجاوز تاريخ الانتهاء" : "عقد يقترب من الانتهاء",
      description: `${item.number} — ${item.title}`,
      href: `/platform/contracts/${item.id}`,
      dueAt: item.endDate,
    })),
    ...milestones.map((item) => ({
      fingerprint: `milestone-due:${item.id}:${item.dueDate!.toISOString().slice(0, 10)}`,
      kind: "milestone" as const,
      severity: item.dueDate! < now ? "danger" as const : "warning" as const,
      title: item.dueDate! < now ? "مرحلة تنفيذ متأخرة" : "مرحلة تنفيذ مستحقة قريبًا",
      description: `${item.contract.number} — ${item.title}`,
      href: `/platform/contracts/${item.contract.id}#execution`,
      dueAt: item.dueDate,
    })),
    ...procurementApprovals.map((item) => ({
      fingerprint: `approval-procurement:${item.id}:${item.updatedAt.toISOString()}`,
      kind: "approval" as const, severity: "info" as const,
      title: "طلب مشتريات ينتظر القرار", description: `${item.number} — ${item.title}`,
      href: `/platform/procurement/${item.id}`, dueAt: null,
    })),
    ...opportunityApprovals.map((item) => ({
      fingerprint: `approval-opportunity:${item.id}:${item.updatedAt.toISOString()}`,
      kind: "approval" as const, severity: "info" as const,
      title: "منافسة تنتظر الاعتماد", description: `${item.number} — ${item.title}`,
      href: `/platform/opportunities/${item.id}`, dueAt: null,
    })),
    ...contractApprovals.map((item) => ({
      fingerprint: `approval-contract:${item.id}:${item.updatedAt.toISOString()}`,
      kind: "approval" as const, severity: "info" as const,
      title: "عقد ينتظر الاعتماد", description: `${item.number} — ${item.title}`,
      href: `/platform/contracts/${item.id}`, dueAt: null,
    })),
  ];

  const receipts = generated.length ? await prisma.notificationReceipt.findMany({
    where: { workspaceId, userId, fingerprint: { in: generated.map((item) => item.fingerprint) } },
  }) : [];
  const receiptMap = new Map(receipts.map((item) => [item.fingerprint, item]));

  return generated
    .filter((item) => !receiptMap.get(item.fingerprint)?.dismissedAt)
    .map((item) => ({ ...item, read: Boolean(receiptMap.get(item.fingerprint)?.readAt) }))
    .sort((a, b) => {
      const severity = { danger: 0, warning: 1, info: 2 };
      return severity[a.severity] - severity[b.severity] || (a.dueAt?.getTime() ?? Infinity) - (b.dueAt?.getTime() ?? Infinity);
    });
}
