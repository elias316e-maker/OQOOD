import Link from "next/link";

import {
  EmptyState,
  FormSection,
  WorkspaceHeader,
} from "@oqood/design-system";

import { hasPermission, Permissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

import styles from "./approvals.module.css";

type ApprovalItem = {
  id: string;
  kind: "procurement" | "opportunity" | "contract" | "amendment";
  number: string;
  title: string;
  status: string;
  updatedAt: Date;
  href: string;
  canDecide: boolean;
  priority: "normal" | "high";
};

const kindLabels: Record<ApprovalItem["kind"], string> = {
  procurement: "طلب مشتريات",
  opportunity: "منافسة",
  contract: "عقد",
  amendment: "ملحق عقد",
};

export default async function ApprovalsPage() {
  const context = await requireCurrentWorkspace();
  const workspaceId = context.workspace.id;
  const canReadProcurement = hasPermission(context, Permissions.procurement.read);
  const canReadOpportunities = hasPermission(context, Permissions.opportunities.read);
  const canReadContracts = hasPermission(context, Permissions.contracts.read);
  const canApproveProcurement = hasPermission(context, Permissions.procurement.approve);
  const canApproveOpportunities = hasPermission(context, Permissions.opportunities.publish)
    || hasPermission(context, Permissions.opportunities.award);
  const canApproveContracts = hasPermission(context, Permissions.contracts.approve);

  const [procurement, opportunities, contracts, amendments] = await Promise.all([
    canReadProcurement
      ? prisma.procurementRequest.findMany({
          where: { workspaceId, status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
          select: { id: true, number: true, title: true, status: true, priority: true, updatedAt: true },
          orderBy: { updatedAt: "asc" },
        })
      : Promise.resolve([]),
    canReadOpportunities
      ? prisma.opportunity.findMany({
          where: { workspaceId, status: { in: ["PENDING_APPROVAL", "AWARD_PENDING"] } },
          select: { id: true, number: true, title: true, status: true, closingDate: true, updatedAt: true },
          orderBy: { updatedAt: "asc" },
        })
      : Promise.resolve([]),
    canReadContracts
      ? prisma.contract.findMany({
          where: { workspaceId, status: "PENDING_APPROVAL" },
          select: { id: true, number: true, title: true, updatedAt: true },
          orderBy: { updatedAt: "asc" },
        })
      : Promise.resolve([]),
    canReadContracts
      ? prisma.contractAmendment.findMany({
          where: { status: "PENDING_APPROVAL", contract: { workspaceId } },
          select: { id: true, number: true, title: true, updatedAt: true, contract: { select: { id: true, number: true } } },
          orderBy: { updatedAt: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const items: ApprovalItem[] = [
    ...procurement.map((item) => ({
      id: item.id,
      kind: "procurement" as const,
      number: item.number,
      title: item.title,
      status: item.status,
      updatedAt: item.updatedAt,
      href: `/platform/procurement/${item.id}`,
      canDecide: canApproveProcurement,
      priority: item.priority === "URGENT" || item.priority === "HIGH" ? "high" as const : "normal" as const,
    })),
    ...opportunities.map((item) => ({
      id: item.id,
      kind: "opportunity" as const,
      number: item.number,
      title: item.title,
      status: item.status,
      updatedAt: item.updatedAt,
      href: `/platform/opportunities/${item.id}`,
      canDecide: canApproveOpportunities,
      priority: item.status === "AWARD_PENDING" ? "high" as const : "normal" as const,
    })),
    ...contracts.map((item) => ({
      id: item.id,
      kind: "contract" as const,
      number: item.number,
      title: item.title,
      status: "PENDING_APPROVAL",
      updatedAt: item.updatedAt,
      href: `/platform/contracts/${item.id}`,
      canDecide: canApproveContracts,
      priority: "high" as const,
    })),
    ...amendments.map((item) => ({
      id: item.id,
      kind: "amendment" as const,
      number: `${item.contract.number} / ${item.number}`,
      title: item.title,
      status: "PENDING_APPROVAL",
      updatedAt: item.updatedAt,
      href: `/platform/contracts/${item.contract.id}#amendments`,
      canDecide: canApproveContracts,
      priority: "normal" as const,
    })),
  ].sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime());

  // Request time is used to calculate the live waiting age.
  const now = new Date();
  const waitingDays = (date: Date) => Math.max(0, Math.floor((now.getTime() - date.getTime()) / 86_400_000));
  const oldCount = items.filter((item) => waitingDays(item.updatedAt) >= 3).length;
  const actionableCount = items.filter((item) => item.canDecide).length;

  return (
    <main className={styles.page}>
      <WorkspaceHeader
        className={styles.header}
        eyebrow="صندوق القرارات"
        title="الموافقات"
        description="الطلبات والمنافسات والعقود التي تنتظر مراجعة أو قرارًا."
        actions={
          <Link
            className={styles.backButton}
            href="/platform"
          >
            العودة إلى الرئيسية
          </Link>
        }
      />

      <section
        aria-label="ملخص الموافقات المعلّقة"
        className={styles.summary}
      >
        <article><span>إجمالي المعلّق</span><strong>{items.length}</strong><small>عبر جميع المسارات</small></article>
        <article><span>يمكنك اتخاذ قرار</span><strong>{actionableCount}</strong><small>وفق صلاحياتك الحالية</small></article>
        <article data-tone={oldCount ? "danger" : "normal"}><span>متأخرة 3 أيام أو أكثر</span><strong>{oldCount}</strong><small>تحتاج أولوية في المعالجة</small></article>
      </section>

      <FormSection
        className={`${styles.panel} ${styles.approvalsPanel}`}
        eyebrow="قائمة العمل"
        title="القرارات المعلّقة"
        description="العناصر التي تنتظر مراجعة أو اعتمادًا، مرتبة من الأقدم إلى الأحدث."
        actions={
          <small>
            {items.length} عنصر
          </small>
        }
      >
        {items.length === 0 ? (
          <EmptyState
            className={styles.empty}
            tone="success"
            icon="✓"
            title="لا توجد موافقات معلّقة"
            description="جميع مسارات العمل الحالية محدثة ولا توجد قرارات تنتظر المعالجة."
            role="status"
          />
        ) : (
          <div className={styles.list}>{items.map((item) => {
            const age = waitingDays(item.updatedAt);
            return <Link data-priority={item.priority} href={item.href} key={`${item.kind}-${item.id}`}>
              <span className={styles.kind}>{kindLabels[item.kind]}</span>
              <div><strong>{item.title}</strong><small>{item.number}</small></div>
              <div className={styles.age}><span>{age === 0 ? "اليوم" : `منذ ${age} يوم`}</span><small>{item.canDecide ? "متاح لك القرار" : "للمتابعة فقط"}</small></div>
              <b aria-hidden="true">←</b>
            </Link>;
          })}</div>
        )}
      </FormSection>
    </main>
  );
}
