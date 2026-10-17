import Link from "next/link";
import { DashboardPanel, EmptyState } from "@oqood/design-system";

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
      <DashboardPanel>
        <EmptyState
          tone="danger"
          role="alert"
          title="تعذر تحميل معايير التقييم"
          description={result.message}
          actions={
            <Link
              className="odsButton odsButton--ghost odsButton--md"
              href={`/platform/opportunities/${opportunityId}`}
            >
              العودة إلى المنافسة
            </Link>
          }
        />
      </DashboardPanel>
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
