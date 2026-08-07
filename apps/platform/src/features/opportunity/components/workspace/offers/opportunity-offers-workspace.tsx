import type {
  OpportunityOfferData,
} from "../../../actions/manage-opportunity-offers";

import {
  FormSection,
} from "@oqood/design-system";


import {
  OpportunityOffersForm,
} from "../../opportunity-offers-form";

import {
  OpportunityKpiGrid,
} from "../dashboard";

type OpportunityOffersWorkspaceProps = {
  data: OpportunityOfferData;
  canEvaluate: boolean;
  canAward: boolean;
  canCreateContract: boolean;
};

function getLowestOffer(
  offers: OpportunityOfferData["offers"],
) {
  if (offers.length === 0) {
    return null;
  }

  return offers.reduce((lowest, offer) => {
    const currentTotal = Number(offer.totalAmount);
    const lowestTotal = Number(lowest.totalAmount);

    if (!Number.isFinite(currentTotal)) {
      return lowest;
    }

    if (!Number.isFinite(lowestTotal)) {
      return offer;
    }

    return currentTotal < lowestTotal
      ? offer
      : lowest;
  });
}

function formatMoney(
  value: string | number,
  currency: string,
) {
  try {
    return new Intl.NumberFormat("ar-SA", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch {
    return String(value);
  }
}

export function OpportunityOffersWorkspace({
  data,
  canEvaluate,
  canAward,
  canCreateContract,
}: OpportunityOffersWorkspaceProps) {
  const lowestOffer = getLowestOffer(data.offers);

  const awardedOffer = data.offers.find(
    (offer) => offer.status === "WINNER",
  );

  return (
    <main className="opportunityOffersWorkspace">
      <OpportunityKpiGrid
        items={[
          {
            label: "العروض المسجلة",
            value: String(data.offers.length),
            helper: "جميع عروض الموردين",
            icon: "▧",
            tone: "purple",
          },
          {
            label: "الموردون المدعوون",
            value: String(data.partners.length),
            helper: "الشركات المؤهلة للتقديم",
            icon: "♧",
            tone: "blue",
          },
          {
            label: "أقل عرض",
            value: lowestOffer
              ? formatMoney(
                  lowestOffer.totalAmount,
                  data.opportunity.currency,
                )
              : "لا يوجد",
            helper: lowestOffer
              ? lowestOffer.partnerName
              : "لم تسجل عروض بعد",
            icon: "↓",
            tone: "green",
          },
          {
            label: "العرض الفائز",
            value: awardedOffer
              ? awardedOffer.partnerName
              : "غير محدد",
            helper: awardedOffer
              ? formatMoney(
                  awardedOffer.totalAmount,
                  data.opportunity.currency,
                )
              : "لم تتم الترسية",
            icon: "♜",
            tone: "amber",
          },
        ]}
      />

      <FormSection
      eyebrow="عروض الموردين"
      title="المقارنة والتقييم والترسية"
      description="راجع العروض التجارية ونتائج التقييم، ثم اعتمد العرض الفائز وأنشئ مسودة العقد."
    />

      <div className="opportunityOffersWorkspace__form">
        <OpportunityOffersForm
          data={data}
          canEvaluate={canEvaluate}
          canAward={canAward}
          canCreateContract={canCreateContract}
        />
      </div>
    </main>
  );
}
