import {
  OpportunityAttachmentsWorkspace,
} from "@/features/opportunity/components";

import {
  hasPermission,
  Permissions,
} from "@/lib/permissions";

import {
  requireCurrentWorkspace,
} from "@/lib/workspace-context";

type OpportunityAttachmentsPageProps = {
  params: Promise<{
    opportunityId: string;
  }>;
};

export default async function OpportunityAttachmentsPage({
  params,
}: OpportunityAttachmentsPageProps) {
  const { opportunityId } = await params;

  const workspaceContext =
    await requireCurrentWorkspace();

  return (
    <OpportunityAttachmentsWorkspace
      opportunityId={opportunityId}
      workspaceId={workspaceContext.workspace.id}
      canManage={hasPermission(
        workspaceContext,
        Permissions.opportunities.update,
      )}
    />
  );
}
