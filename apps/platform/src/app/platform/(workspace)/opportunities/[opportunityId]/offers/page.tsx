import Link from "next/link";
import { DashboardPanel, EmptyState } from "@oqood/design-system";

import {
  getOpportunityOffersAction,
} from "@/features/opportunity/actions";

import {
  OpportunityOffersWorkspace,
} from "@/features/opportunity/components";

import {
  hasPermission,
  Permissions,
} from "@/lib/permissions";

import {
  requireCurrentWorkspace,
} from "@/lib/workspace-context";

type OpportunityOffersPageProps = {
  params: Promise<{
    opportunityId: string;
  }>;
};

export default async function OpportunityOffersPage({
  params,
}: OpportunityOffersPageProps) {
  const { opportunityId } = await params;

  const [result, workspaceContext] =
    await Promise.all([
      getOpportunityOffersAction(
        opportunityId,
      ),
      requireCurrentWorkspace(),
    ]);

  if (!result.success) {
    return (
      <DashboardPanel>
        <EmptyState
          tone="danger"
          role="alert"
          title="تعذر تحميل عروض الموردين"
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
    <OpportunityOffersWorkspace
      data={result.data}
      canEvaluate={hasPermission(
        workspaceContext,
        Permissions.opportunities.evaluate,
      )}
      canAward={hasPermission(
        workspaceContext,
        Permissions.opportunities.award,
      )}
      canCreateContract={hasPermission(
        workspaceContext,
        Permissions.contracts.create,
      )}
    />
  );
}
