import Link from "next/link";

import {
  getOpportunitySetupAction,
} from "@/features/opportunity/actions";

import {
  OpportunityPartnersForm,
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
      <main className="platformContent">
        <section className="dashboardPanel opportunityVisiblePanel">
          <div className="emptyState" role="alert">
            <h1>تعذر تحميل شركاء الأعمال</h1>
            <p>{result.message}</p>
            <Link
              className="primaryButton compactButton"
              href={`/platform/opportunities/${opportunityId}`}
            >
              العودة إلى الفرصة
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <OpportunityPartnersForm
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

