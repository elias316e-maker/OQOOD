import { hasPermission, Permissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import type { CurrentWorkspaceContext } from "@/lib/workspace-context";

export type SearchResult = {
  id: string;
  type: "project" | "procurement" | "opportunity" | "contract" | "partner" | "document";
  title: string;
  reference: string;
  description: string | null;
  status: string;
  href: string;
  updatedAt: Date;
};

export type SearchGroup = {
  key: SearchResult["type"];
  label: string;
  results: SearchResult[];
};

const groupLabels: Record<SearchResult["type"], string> = {
  project: "المشاريع",
  procurement: "طلبات المشتريات",
  opportunity: "المنافسات",
  contract: "العقود",
  partner: "الموردون والشركاء",
  document: "المستندات",
};

export async function searchWorkspace(
  context: CurrentWorkspaceContext,
  rawQuery: string,
): Promise<SearchGroup[]> {
  const query = rawQuery.trim().slice(0, 120);
  if (query.length < 2) return [];
  const workspaceId = context.workspace.id;
  const contains = { contains: query, mode: "insensitive" as const };

  const [projects, procurement, opportunities, contracts, partners, documents] = await Promise.all([
    hasPermission(context, Permissions.workspace.read)
      ? prisma.project.findMany({
          where: { workspaceId, OR: [{ code: contains }, { nameAr: contains }, { nameEn: contains }, { description: contains }] },
          select: { id: true, code: true, nameAr: true, description: true, status: true, updatedAt: true },
          orderBy: { updatedAt: "desc" },
          take: 8,
        })
      : [],
    hasPermission(context, Permissions.procurement.read)
      ? prisma.procurementRequest.findMany({
          where: { workspaceId, OR: [{ number: contains }, { title: contains }, { description: contains }, { category: contains }] },
          select: { id: true, number: true, title: true, description: true, status: true, updatedAt: true },
          orderBy: { updatedAt: "desc" },
          take: 8,
        })
      : [],
    hasPermission(context, Permissions.opportunities.read)
      ? prisma.opportunity.findMany({
          where: { workspaceId, OR: [{ number: contains }, { title: contains }, { description: contains }, { category: contains }] },
          select: { id: true, number: true, title: true, description: true, status: true, updatedAt: true },
          orderBy: { updatedAt: "desc" },
          take: 8,
        })
      : [],
    hasPermission(context, Permissions.contracts.read)
      ? prisma.contract.findMany({
          where: {
            workspaceId,
            OR: [{ number: contains }, { title: contains }, { description: contains }, { businessPartner: { nameAr: contains } }],
          },
          select: { id: true, number: true, title: true, description: true, status: true, updatedAt: true, businessPartner: { select: { nameAr: true } } },
          orderBy: { updatedAt: "desc" },
          take: 8,
        })
      : [],
    hasPermission(context, Permissions.vendors.read)
      ? prisma.businessPartner.findMany({
          where: {
            workspaceId,
            OR: [{ nameAr: contains }, { nameEn: contains }, { commercialRegister: contains }, { taxNumber: contains }, { email: contains }, { city: contains }],
          },
          select: { id: true, nameAr: true, commercialRegister: true, city: true, verificationStatus: true, updatedAt: true },
          orderBy: { updatedAt: "desc" },
          take: 8,
        })
      : [],
    hasPermission(context, Permissions.workspace.read)
      ? prisma.document.findMany({
          where: {
            workspaceId,
            deletedAt: null,
            OR: [{ title: contains }, { fileName: contains }, { category: contains }, { notes: contains }],
          },
          select: { id: true, title: true, fileName: true, category: true, reviewStatus: true, updatedAt: true },
          orderBy: { updatedAt: "desc" },
          take: 8,
        })
      : [],
  ]);

  const groups: SearchGroup[] = [
    {
      key: "project",
      label: groupLabels.project,
      results: projects.map((item) => ({
        id: item.id, type: "project", title: item.nameAr, reference: item.code,
        description: item.description, status: item.status, href: `/platform/projects/${item.id}`, updatedAt: item.updatedAt,
      })),
    },
    {
      key: "procurement",
      label: groupLabels.procurement,
      results: procurement.map((item) => ({
        id: item.id, type: "procurement", title: item.title, reference: item.number,
        description: item.description, status: item.status, href: `/platform/procurement/${item.id}`, updatedAt: item.updatedAt,
      })),
    },
    {
      key: "opportunity",
      label: groupLabels.opportunity,
      results: opportunities.map((item) => ({
        id: item.id, type: "opportunity", title: item.title, reference: item.number,
        description: item.description, status: item.status, href: `/platform/opportunities/${item.id}`, updatedAt: item.updatedAt,
      })),
    },
    {
      key: "contract",
      label: groupLabels.contract,
      results: contracts.map((item) => ({
        id: item.id, type: "contract", title: item.title, reference: item.number,
        description: item.businessPartner.nameAr, status: item.status, href: `/platform/contracts/${item.id}`, updatedAt: item.updatedAt,
      })),
    },
    {
      key: "partner",
      label: groupLabels.partner,
      results: partners.map((item) => ({
        id: item.id, type: "partner", title: item.nameAr, reference: item.commercialRegister ?? "شريك أعمال",
        description: item.city, status: item.verificationStatus, href: `/platform/partners/${item.id}`, updatedAt: item.updatedAt,
      })),
    },
    {
      key: "document",
      label: groupLabels.document,
      results: documents.map((item) => ({
        id: item.id, type: "document", title: item.title, reference: item.fileName,
        description: item.category, status: item.reviewStatus, href: `/platform/documents?document=${item.id}`, updatedAt: item.updatedAt,
      })),
    },
  ];
  return groups.filter((group) => group.results.length > 0);
}
