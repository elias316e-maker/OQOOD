import { DashboardPanel, EmptyState } from "@oqood/design-system";

import Link from "next/link";

import {
  getOpportunitySetupAction,
} from "@/features/opportunity/actions";

import {
  OpportunityPartnersWorkspace,
} from "@/features/opportunity/components";

type OpportunityPartnersPageProps = {
  params: Promise<{
    opportunityId: string;
  }>;
};

export default async function OpportunityPartnersPage({
  params,
}: OpportunityPartnersPageProps) {
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
          title="تعذر تحميل الموردين"
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
    <OpportunityPartnersWorkspace
      opportunity={result.data.opportunity}
      partners={result.data.partners}
      initialPartnerIds={
        result.data.invitation.partnerIds
      }
      initialMessage={
        result.data.invitation.message
      }
    />
  );
}
