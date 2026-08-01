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
  const workspaceContext =
    await requireCurrentWorkspace();

  return (
    <OpportunityCriteriaWorkspace
      opportunityId={opportunityId}
      canManage={hasPermission(
        workspaceContext,
        Permissions.opportunities.update,
      )}
    />
  );
}
