import type {
  OpportunityOfferData,
} from "../../../actions/manage-opportunity-offers";

import {
  OpportunityKpiGrid,
} from "../dashboard";

import {
  WorkspaceCard,
  WorkspaceSectionHeader,
} from "../shared";

type OpportunityEvaluationWorkspaceProps = {
  data: OpportunityOfferData;
};

export function OpportunityEvaluationWorkspace({
  data,
}: OpportunityEvaluationWorkspaceProps) {
  const technicallyAccepted = data.offers.filter(
    (offer) =>
      [
        "TECHNICALLY_ACCEPTED",
        "FINANCIALLY_EVALUATED",
        "AWARDED",
      ].includes(offer.status),
  ).length;

  const financiallyEvaluated = data.offers.filter(
    (offer) =>
      [
        "FINANCIALLY_EVALUATED",
        "AWARDED",
      ].includes(offer.status),
  ).length;

  const awardedOffer = data.offers.find(
    (offer) => offer.status === "AWARDED",
  );

  function formatMoney(
    value: string | number,
  ) {
    try {
      return new Intl.NumberFormat("ar-SA", {
        style: "currency",
        currency: data.opportunity.currency,
        maximumFractionDigits: 2,
      }).format(Number(value));
    } catch {
      return String(value);
    }
  }

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

      <WorkspaceCard>
        <WorkspaceSectionHeader
          eyebrow="التقييم الفني والمالي"
          title="مصفوفة تقييم العروض"
          description="عرض حالة كل عرض ومرحلة التقييم الحالية، مع الإبقاء على إجراءات القبول والترسية داخل صفحة العروض."
        />
      </WorkspaceCard>

      <WorkspaceCard>
        {data.offers.length === 0 ? (
          <div className="opportunityWorkspaceEmptyPanel">
            <span className="opportunityWorkspaceEmptyPanel__icon">
              ◫
            </span>

            <h2>لا توجد عروض للتقييم</h2>

            <p>
              يجب تسجيل عروض الموردين أولًا قبل بدء التقييم.
            </p>
          </div>
        ) : (
          <div className="opportunityEvaluationWorkspace__table">
            <table>
              <thead>
                <tr>
                  <th>المورد</th>
                  <th>رقم العرض</th>
                  <th>الحالة</th>
                  <th>القيمة الإجمالية</th>
                  <th>مدة التسليم</th>
                  <th>الصلاحية</th>
                </tr>
              </thead>

              <tbody>
                {data.offers.map((offer) => (
                  <tr key={offer.id}>
                    <td>
                      <strong>{offer.partnerName}</strong>
                    </td>

                    <td>
                      {offer.referenceNumber ?? "—"}
                    </td>

                    <td>
                      <span
                        className={
                          `opportunityEvaluationStatus ` +
                          `status-${offer.status.toLowerCase()}`
                        }
                      >
                        {offer.status}
                      </span>
                    </td>

                    <td>
                      {formatMoney(
                        offer.totalAmount,
                      )}
                    </td>

                    <td>
                      {offer.deliveryDays
                        ? `${offer.deliveryDays} يوم`
                        : "—"}
                    </td>

                    <td>
                      {offer.validityDays
                        ? `${offer.validityDays} يوم`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </WorkspaceCard>
    </main>
  );
}
