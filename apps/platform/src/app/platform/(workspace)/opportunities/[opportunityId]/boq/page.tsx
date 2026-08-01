import Link from "next/link";

import {
  getOpportunitySetupAction,
} from "@/features/opportunity/actions";

import {
  OpportunityBoqWorkspace,
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
      <main className="opportunityWorkspaceSection">
        <section className="opportunityWorkspaceEmptyPanel">
          <h1>تعذر تحميل جدول الكميات</h1>
          <p>{result.message}</p>

          <Link
            className="primaryButton compactButton"
            href={`/platform/opportunities/${opportunityId}`}
          >
            العودة إلى المنافسة
          </Link>
        </section>
      </main>
    );
  }

  return (
    <OpportunityBoqWorkspace
      opportunity={result.data.opportunity}
      items={result.data.items}
    />
  );
}
