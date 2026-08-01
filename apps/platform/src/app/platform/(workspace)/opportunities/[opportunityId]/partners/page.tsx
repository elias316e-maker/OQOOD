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
      <main className="opportunityWorkspaceSection">
        <section className="opportunityWorkspaceEmptyPanel">
          <h1>تعذر تحميل الموردين</h1>
          <p>{result.message}</p>

          <Link
            className="primaryButton compactButton"
            href={`/platform/opportunities/${opportunityId}`}
          >
            العودة إلى المنافسة
          </Link>
        </section>
      </main>
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
