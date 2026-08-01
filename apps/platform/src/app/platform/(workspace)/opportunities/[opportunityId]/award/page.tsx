import {
  getOpportunityOffersAction,
} from "@/features/opportunity/actions";

import {
  OpportunityAwardWorkspace,
} from "@/features/opportunity/components";

import {
  hasPermission,
  Permissions,
} from "@/lib/permissions";

import {
  requireCurrentWorkspace,
} from "@/lib/workspace-context";

type OpportunityAwardPageProps = {
  params: Promise<{
    opportunityId: string;
  }>;
};

export default async function OpportunityAwardPage({
  params,
}: OpportunityAwardPageProps) {
  const { opportunityId } = await params;

  const [result, workspaceContext] =
    await Promise.all([
      getOpportunityOffersAction(opportunityId),
      requireCurrentWorkspace(),
    ]);

  if (!result.success) {
    return (
      <main className="opportunityWorkspaceSection">
        <section className="opportunityWorkspaceEmptyPanel">
          <h1>تعذر تحميل بيانات الترسية</h1>
          <p>{result.message}</p>
        </section>
      </main>
    );
  }

  return (
    <OpportunityAwardWorkspace
      data={result.data}
      canCreateContract={hasPermission(
        workspaceContext,
        Permissions.contracts.create,
      )}
    />
  );
}
