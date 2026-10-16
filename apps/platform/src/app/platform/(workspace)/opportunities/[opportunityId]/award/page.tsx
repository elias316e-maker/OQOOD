import Link from "next/link";
import { DashboardPanel, EmptyState } from "@oqood/design-system";

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
      <DashboardPanel>
        <EmptyState
          tone="danger"
          role="alert"
          title="تعذر تحميل بيانات الترسية"
          description={result.message}
          actions={
            <Link
              className="odsButton odsButton--outline odsButton--md"
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
    <OpportunityAwardWorkspace
      data={result.data}
      canCreateContract={hasPermission(
        workspaceContext,
        Permissions.contracts.create,
      )}
    />
  );
}
