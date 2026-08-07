import type {
  OpportunityOfferData,
} from "../../../actions/manage-opportunity-offers";

import {
  EmptyState,
  FormSection,
} from "@oqood/design-system";


import {
  OpportunityKpiGrid,
} from "../dashboard";

import {
  WorkspaceCard,
  WorkspaceSectionHeader,
} from "../shared";

import {
  OpportunityEvaluationSelector,
} from "./opportunity-evaluation-selector";

type OpportunityEvaluationWorkspaceProps = {
  data: OpportunityOfferData;
  canEvaluate: boolean;
};

export function OpportunityEvaluationWorkspace({
  data,
  canEvaluate,
}: OpportunityEvaluationWorkspaceProps) {
  const technicallyAccepted =
    data.offers.filter((offer) =>
      [
        "TECHNICALLY_ACCEPTED",
        "FINANCIALLY_EVALUATED",
        "WINNER",
      ].includes(offer.status),
    ).length;

  const financiallyEvaluated =
    data.offers.filter((offer) =>
      [
        "FINANCIALLY_EVALUATED",
        "WINNER",
      ].includes(offer.status),
    ).length;

  const awardedOffer =
    data.offers.find(
      (offer) => offer.status === "WINNER",
    );

  return (
    <main className="opportunityEvaluationWorkspace">
      <OpportunityKpiGrid
        items={[
          {
            label: "إجمالي العروض",
            value: String(data.offers.length),
            helper: "العروض المسجلة للمنافسة",
            icon: "▧",
            tone: "purple",
          },
          {
            label: "مقبولة فنيًا",
            value: String(technicallyAccepted),
            helper: "اجتازت التقييم الفني",
            icon: "✓",
            tone: "green",
          },
          {
            label: "مقيّمة ماليًا",
            value: String(financiallyEvaluated),
            helper: "تمت مراجعتها ماليًا",
            icon: "◫",
            tone: "blue",
          },
          {
            label: "العرض الفائز",
            value: awardedOffer
              ? awardedOffer.partnerName
              : "غير محدد",
            helper: awardedOffer
              ? "تم اعتماد الترسية"
              : "لم تتم الترسية",
            icon: "♜",
            tone: "amber",
          },
        ]}
      />

      <FormSection
      eyebrow="التقييم الفني والمالي"
      title="مصفوفة تقييم العروض"
      description="اختر عرضًا ثم قيّم معايير المنافسة واحفظ الدرجات قبل اعتماد النتيجة الفنية."
    >

    </FormSection>

      <OpportunityEvaluationSelector
        data={data}
        canEvaluate={canEvaluate}
      />
    </main>
  );
}
