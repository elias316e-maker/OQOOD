import {
  getFinancialEvaluationAction,
  getOpportunityOffersAction,
} from "@/features/opportunity/actions";

import {
  FinancialEvaluationManager,
  OpportunityEvaluationWorkspace,
} from "@/features/opportunity/components";

import {
  hasPermission,
  Permissions,
} from "@/lib/permissions";

import {
  requireCurrentWorkspace,
} from "@/lib/workspace-context";

type OpportunityEvaluationPageProps = {
  params: Promise<{
    opportunityId: string;
  }>;
};

export default async function OpportunityEvaluationPage({
  params,
}: OpportunityEvaluationPageProps) {
  const { opportunityId } = await params;

  const [
    offersResult,
    financialResult,
    workspaceContext,
  ] = await Promise.all([
    getOpportunityOffersAction(opportunityId),
    getFinancialEvaluationAction(opportunityId),
    requireCurrentWorkspace(),
  ]);

  if (!offersResult.success) {
    return (
      <main className="opportunityWorkspaceSection">
        <section className="opportunityWorkspaceEmptyPanel">
          <h1>تعذر تحميل بيانات التقييم</h1>
          <p>{offersResult.message}</p>
        </section>
      </main>
    );
  }

  const canEvaluate = hasPermission(
    workspaceContext,
    Permissions.opportunities.evaluate,
  );

  return (
    <>
      <OpportunityEvaluationWorkspace
        data={offersResult.data}
        canEvaluate={canEvaluate}
      />

      {financialResult.success ? (
        <FinancialEvaluationManager
          evaluation={financialResult.data}
          canEvaluate={canEvaluate}
        />
      ) : (
        <section className="opportunityWorkspaceCard">
          <div
            className="formAlert formAlertError"
            role="alert"
          >
            {financialResult.message}
          </div>
        </section>
      )}
    </>
  );
}
