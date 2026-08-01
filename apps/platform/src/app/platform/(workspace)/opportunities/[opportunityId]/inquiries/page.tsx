import {
  OpportunityInquiriesWorkspace,
} from "@/features/opportunity/components";

import {
  hasPermission,
  Permissions,
} from "@/lib/permissions";

import {
  requireCurrentWorkspace,
} from "@/lib/workspace-context";

type OpportunityInquiriesPageProps = {
  params: Promise<{
    opportunityId: string;
  }>;
};

export default async function OpportunityInquiriesPage({
  params,
}: OpportunityInquiriesPageProps) {
  const { opportunityId } = await params;

  const workspaceContext =
    await requireCurrentWorkspace();

  return (
    <OpportunityInquiriesWorkspace
      opportunityId={opportunityId}
      canManage={hasPermission(
        workspaceContext,
        Permissions.opportunities.update,
      )}
    />
  );
}
