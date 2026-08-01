import {
  getOpportunityOffersAction,
} from "@/features/opportunity/actions";

import {
  OpportunityEvaluationWorkspace,
} from "@/features/opportunity/components";

type OpportunityEvaluationPageProps = {
  params: Promise<{
    opportunityId: string;
  }>;
};

export default async function OpportunityEvaluationPage({
  params,
}: OpportunityEvaluationPageProps) {
  const { opportunityId } = await params;

  const result =
    await getOpportunityOffersAction(
      opportunityId,
    );

  if (!result.success) {
    return (
      <main className="opportunityWorkspaceSection">
        <section className="opportunityWorkspaceEmptyPanel">
          <h1>تعذر تحميل بيانات التقييم</h1>
          <p>{result.message}</p>
        </section>
      </main>
    );
  }

  return (
    <OpportunityEvaluationWorkspace
      data={result.data}
    />
  );
}
