import {
  listOpportunityCriteriaAction,
} from "@/features/opportunity/actions";

import {
  OpportunityCriteriaWorkspace,
} from "@/features/opportunity/components";

import {
  hasPermission,
  Permissions,
} from "@/lib/permissions";

import {
  requireCurrentWorkspace,
} from "@/lib/workspace-context";

type AcceptanceCriteriaPageProps = {
  params: Promise<{
    opportunityId: string;
  }>;
};

export default async function AcceptanceCriteriaPage({
  params,
}: AcceptanceCriteriaPageProps) {
  const { opportunityId } = await params;

  const [result, workspaceContext] =
    await Promise.all([
      listOpportunityCriteriaAction(opportunityId),
      requireCurrentWorkspace(),
    ]);

  if (!result.success) {
    return (
      <main className="opportunityWorkspaceSection">
        <section className="opportunityWorkspaceEmptyPanel">
          <h1>تعذر تحميل معايير التقييم</h1>
          <p>{result.message}</p>
        </section>
      </main>
    );
  }

  return (
    <OpportunityCriteriaWorkspace
      opportunityId={opportunityId}
      criteria={result.data.criteria}
      totalWeight={result.data.totalWeight}
      canManage={hasPermission(
        workspaceContext,
        Permissions.opportunities.update,
      )}
    />
  );
}
