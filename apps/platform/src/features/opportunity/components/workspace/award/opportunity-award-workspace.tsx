import Link from "next/link";

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

import {
  EmptyState,
  FormSection,
} from "@oqood/design-system";


type OpportunityAwardWorkspaceProps = {
  data: OpportunityOfferData;
  canCreateContract: boolean;
};

function formatMoney(
  value: string | number,
  currency: string,
) {
  try {
    return new Intl.NumberFormat("ar-SA", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number(value));
  } catch {
    return String(value);
  }
}

export function OpportunityAwardWorkspace({
  data,
  canCreateContract,
}: OpportunityAwardWorkspaceProps) {
  const awardedOffer = data.offers.find(
    (offer) => offer.status === "WINNER",
  );

  const financiallyEvaluated = data.offers.filter(
    (offer) =>
      ["FINANCIALLY_EVALUATED", "WINNER"].includes(
        offer.status,
      ),
  ).length;

  return (
    <main className="opportunityAwardWorkspace">
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
            label: "المقيّمة ماليًا",
            value: String(financiallyEvaluated),
            helper: "جاهزة لاتخاذ القرار",
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
              : "لم يصدر قرار بعد",
            icon: "♜",
            tone: "green",
          },
          {
            label: "قيمة الترسية",
            value: awardedOffer
              ? formatMoney(
                  awardedOffer.totalAmount,
                  data.opportunity.currency,
                )
              : "—",
            helper: awardedOffer
              ? "إجمالي العرض الفائز"
              : "بانتظار اعتماد العرض",
            icon: "◈",
            tone: "amber",
          },
        ]}
      />

      <WorkspaceCard>
        <WorkspaceSectionHeader
          eyebrow="قرار المنافسة"
          title="الترسية والاعتماد"
          description="مراجعة العرض الفائز وقيمة الترسية والبيانات التجارية قبل إنشاء العقد."
          actions={
            <Link
              className="secondaryButton compactButton"
              href={`/platform/opportunities/${data.opportunity.id}/offers`}
            >
              العودة إلى العروض
            </Link>
          }
        />
      </WorkspaceCard>

      {awardedOffer ? (
        <section className="opportunityAwardWorkspace__grid">
          <FormSection
        className="opportunityAwardWinner"
        eyebrow="العرض الفائز"
        title={awardedOffer.partnerName}
        actions={
          <span className="opportunityAwardWinner__badge">
            تمت الترسية
          </span>
        }
      >
        <dl>
              <div>
                <dt>رقم العرض</dt>
                <dd>
                  {awardedOffer.referenceNumber ?? "غير محدد"}
                </dd>
              </div>

              <div>
                <dt>الإجمالي قبل الضريبة</dt>
                <dd>
                  {formatMoney(
                    awardedOffer.subtotal,
                    data.opportunity.currency,
                  )}
                </dd>
              </div>

              <div>
                <dt>قيمة الضريبة</dt>
                <dd>
                  {formatMoney(
                    awardedOffer.taxAmount,
                    data.opportunity.currency,
                  )}
                </dd>
              </div>

              <div>
                <dt>إجمالي الترسية</dt>
                <dd>
                  {formatMoney(
                    awardedOffer.totalAmount,
                    data.opportunity.currency,
                  )}
                </dd>
              </div>

              <div>
                <dt>مدة التسليم</dt>
                <dd>
                  {awardedOffer.deliveryDays
                    ? `${awardedOffer.deliveryDays} يوم`
                    : "غير محدد"}
                </dd>
              </div>

              <div>
                <dt>صلاحية العرض</dt>
                <dd>
                  {awardedOffer.validityDays
                    ? `${awardedOffer.validityDays} يوم`
                    : "غير محدد"}
                </dd>
              </div>
            </dl>
      </FormSection>

          <FormSection
        eyebrow="الخطوة التالية"
        title="إنشاء العقد"
        description="يتم إنشاء مسودة العقد من صفحة العروض باستخدام العرض الفائز المعتمد."
      >
        {canCreateContract ? (
              <Link
                className="primaryButton compactButton"
                href={`/platform/opportunities/${data.opportunity.id}/offers`}
              >
                الانتقال لإنشاء مسودة العقد
              </Link>
            ) : (
              <EmptyState
            className="opportunityAwardWorkspace__permission"
            tone="warning"
            icon="!"
            title="لا توجد صلاحية لإنشاء العقد"
            description="يلزم الحصول على صلاحية إنشاء العقود لإكمال هذه الخطوة."
          />
            )}
      </FormSection>
        </section>
      ) : (
        <WorkspaceCard>
          <EmptyState
        icon="♜"
        title="لم تتم ترسية المنافسة بعد"
        description="راجع التقييم الفني والمالي، ثم اعتمد العرض الفائز من صفحة العروض."
        actions={
          <Link
            className="primaryButton compactButton"
            href={`/platform/opportunities/${data.opportunity.id}/offers`}
          >
            الانتقال إلى العروض
          </Link>
        }
      />
        </WorkspaceCard>
      )}
    </main>
  );
}
