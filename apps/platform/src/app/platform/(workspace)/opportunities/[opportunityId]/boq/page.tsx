import { DashboardPanel, EmptyState } from "@oqood/design-system";

import Link from "next/link";

import {
  getOpportunitySetupAction,
} from "@/features/opportunity/actions";

import {
  OpportunityBoqWorkspace,
} from "@/features/opportunity/components";

type OpportunityBoqPageProps = {
  params: Promise<{
    opportunityId: string;
  }>;
};

export default async function OpportunityBoqPage({
  params,
}: OpportunityBoqPageProps) {
  const { opportunityId } = await params;

  const result =
    await getOpportunitySetupAction(
      opportunityId,
    );

  if (!result.success) {
    return (
      <DashboardPanel>
        <EmptyState
          tone="danger"
          role="alert"
          title="تعذر تحميل جدول الكميات"
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
    <OpportunityBoqWorkspace
      opportunity={result.data.opportunity}
      items={result.data.items}
    />
  );
}
