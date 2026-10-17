import styles from "./page.module.css";

import Link from "next/link";

import {
  Alert,
  DashboardPanel,
  EmptyState,
  KpiCard,
  WorkspaceHeader,
} from "@oqood/design-system";


import { OpportunityDirectory } from "@/features/opportunity/components";
import { listWorkspaceOpportunitiesAction } from "@/features/opportunity/actions/list-workspace-opportunities";
import type { OpportunitySummaryResponse } from "@/features/opportunity/dtos";
import { hasPermission, Permissions } from "@/lib/permissions";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

type OpportunityStatus = OpportunitySummaryResponse["status"];

function countByStatuses(
  opportunities: readonly OpportunitySummaryResponse[],
  statuses: readonly OpportunityStatus[],
) {
  const accepted = new Set<OpportunityStatus>(statuses);
  return opportunities.filter((opportunity) => accepted.has(opportunity.status)).length;
}

export default async function OpportunitiesPage() {
  const [result, workspaceContext] = await Promise.all([
    listWorkspaceOpportunitiesAction({ page: 1, pageSize: 50 }),
    requireCurrentWorkspace(),
  ]);

  const canCreate = hasPermission(workspaceContext, Permissions.opportunities.create);

  if (!result.success) {
    return (
      <main className={styles.page}>
        <WorkspaceHeader title="المنافسات" eyebrow="إدارة المنافسات" />
        <DashboardPanel>
          <Alert tone="danger" title="تعذر تحميل المنافسات">
            <p>{result.message}</p>
            <Link className="odsButton odsButton--primary odsButton--md" href="/platform/opportunities">إعادة المحاولة</Link>
          </Alert>
        </DashboardPanel>
      </main>
    );
  }

  const { items: opportunities, total, page, totalPages } = result.data;
  const openCount = countByStatuses(opportunities, ["APPROVED", "PUBLISHED", "CLARIFICATION"]);
  const evaluationCount = countByStatuses(opportunities, [
    "TECHNICAL_EVALUATION",
    "FINANCIAL_EVALUATION",
    "NEGOTIATION",
    "AWARD_PENDING",
  ]);
  const completedCount = countByStatuses(opportunities, ["AWARDED", "CLOSED"]);
  const now = new Date().getTime();

  const closingSoonCount = opportunities.filter((opportunity) => {
    if (!opportunity.closingDate) return false;
    const remaining =
      new Date(opportunity.closingDate).getTime() - now;
    return remaining > 0 && remaining <= 7 * 24 * 60 * 60 * 1000;
  }).length;

  return (
    <main className={styles.page}>
      <WorkspaceHeader
        eyebrow="إدارة المنافسات"
        title="المنافسات"
        description="استعرض وشارك في جميع المنافسات والفرص المتاحة من مكان واحد."
        actions={
          canCreate ? (
            <Link
              className="odsButton odsButton--primary odsButton--md"
              href="/platform/opportunities/new"
            >
              ＋ إنشاء منافسة جديدة
            </Link>
          ) : null
        }
      />

      <section className={styles.summary} aria-label="ملخص المنافسات">
        <KpiCard label="إجمالي المنافسات" value={total} description="جميع المنافسات" tone="primary" />
        <KpiCard label="مفتوحة" value={openCount} description="متاحة للمشاركة" tone="success" />
        <KpiCard label="قيد التقييم" value={evaluationCount} description="تحت المراجعة" tone="warning" />
        <KpiCard label="مكتملة" value={completedCount} description="تمت الترسية" tone="info" />
        <KpiCard label="تنتهي قريبًا" value={closingSoonCount} description="خلال 7 أيام" tone="danger" />
      </section>

      <DashboardPanel>
        {opportunities.length === 0 ? (
          <EmptyState
            role="status"
            title="لا توجد منافسات حتى الآن"
            description="لم تُنشأ أي منافسة داخل مساحة العمل الحالية."
            actions={canCreate ? (
              <Link className="odsButton odsButton--primary odsButton--md" href="/platform/opportunities/new">إنشاء منافسة جديدة</Link>
            ) : null}
          />
        ) : (
          <OpportunityDirectory
            opportunities={opportunities}
            total={total}
            page={page}
            totalPages={totalPages}
            canCreate={canCreate}
          />
        )}
      </DashboardPanel>
    </main>
  );
}
