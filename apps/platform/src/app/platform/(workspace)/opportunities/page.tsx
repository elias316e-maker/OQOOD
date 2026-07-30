import Link from "next/link";

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
      <main className="platformContent">
        <section className="dashboardPanel" role="alert">
          <div className="emptyState">
            <h1>تعذر تحميل المنافسات</h1>
            <p>{result.message}</p>
            <Link className="primaryButton compactButton" href="/platform/opportunities">إعادة المحاولة</Link>
          </div>
        </section>
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
  const closingSoonCount = opportunities.filter((opportunity) => {
    if (!opportunity.closingDate) return false;
    const remaining = new Date(opportunity.closingDate).getTime() - Date.now();
    return remaining > 0 && remaining <= 7 * 24 * 60 * 60 * 1000;
  }).length;

  return (
    <main className="platformContent opportunityDirectoryRefresh approvedOpportunityDirectory">
      <section className="opportunityDirectoryHeader approvedOpportunityHeader">
        <div className="approvedOpportunityTitle">
          <span className="approvedOpportunityTitleIcon" aria-hidden="true">♜</span>
          <div>
            <span className="pageEyebrow">إدارة المنافسات</span>
            <h1>المنافسات</h1>
            <p>استعرض وشارك في جميع المنافسات والفرص المتاحة من مكان واحد.</p>
          </div>
        </div>

        {canCreate && (
          <Link className="primaryButton compactButton" href="/platform/opportunities/new">
            ＋ إنشاء منافسة جديدة
          </Link>
        )}
      </section>

      <section className="listSummaryCards approvedOpportunityKpis" aria-label="ملخص المنافسات">
        <article><span className="approvedKpiIcon purple">◇</span><div><span>إجمالي المنافسات</span><strong>{total}</strong><small>جميع المنافسات</small></div></article>
        <article><span className="approvedKpiIcon green">♧</span><div><span>مفتوحة</span><strong>{openCount}</strong><small>متاحة للمشاركة</small></div></article>
        <article><span className="approvedKpiIcon amber">⌛</span><div><span>قيد التقييم</span><strong>{evaluationCount}</strong><small>تحت المراجعة</small></div></article>
        <article><span className="approvedKpiIcon blue">✓</span><div><span>مكتملة</span><strong>{completedCount}</strong><small>تمت الترسية</small></div></article>
        <article><span className="approvedKpiIcon rose">▣</span><div><span>تنتهي قريبًا</span><strong>{closingSoonCount}</strong><small>خلال 7 أيام</small></div></article>
      </section>

      <section className="dashboardPanel opportunityListPanel opportunityCardsPanel approvedOpportunityPanel">
        {opportunities.length === 0 ? (
          <div className="emptyState" role="status">
            <h2>لا توجد منافسات حتى الآن</h2>
            <p>لم تُنشأ أي منافسة داخل مساحة العمل الحالية.</p>
            {canCreate && <Link className="primaryButton compactButton" href="/platform/opportunities/new">إنشاء منافسة جديدة</Link>}
          </div>
        ) : (
          <OpportunityDirectory
            opportunities={opportunities}
            total={total}
            page={page}
            totalPages={totalPages}
            canCreate={canCreate}
          />
        )}
      </section>
    </main>
  );
}
