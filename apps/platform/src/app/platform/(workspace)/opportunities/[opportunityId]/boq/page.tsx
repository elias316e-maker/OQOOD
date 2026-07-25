import Link from "next/link";

import {
  getOpportunitySetupAction,
} from "@/features/opportunity/actions";

import {
  OpportunityBoqForm,
} from "@/features/opportunity/components";

type OpportunityBoqPageProps = {
  params: Promise<{
    opportunityId: string;
  }>;
};

export default async function OpportunityBoqPage({
  params,
}: OpportunityBoqPageProps) {
  const { opportunityId } = await params;
  const result =
    await getOpportunitySetupAction(
      opportunityId,
    );

  if (!result.success) {
    return (
      <main className="platformContent">
        <section className="dashboardPanel opportunityVisiblePanel">
          <div className="emptyState" role="alert">
            <h1>تعذر تحميل جدول الكميات</h1>
            <p>{result.message}</p>
            <Link
              className="primaryButton compactButton"
              href={`/platform/opportunities/${opportunityId}`}
            >
              العودة إلى الفرصة
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <OpportunityBoqForm
      opportunity={result.data.opportunity}
      initialItems={result.data.items}
    />
  );
}

