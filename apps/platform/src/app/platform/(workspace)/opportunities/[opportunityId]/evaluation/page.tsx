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

import {
  Alert,
  DashboardPanel,
  EmptyState,
} from "@oqood/design-system";

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
      <DashboardPanel>
        <EmptyState
          tone="danger"
          role="alert"
          title="تعذر تحميل بيانات التقييم"
          description={offersResult.message}
        />
      </DashboardPanel>
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
        <DashboardPanel>
          <Alert
             tone="danger"
            role="alert"
          >
            {financialResult.message}
          </Alert>
        </DashboardPanel>
      )}
    </>
  );
}
