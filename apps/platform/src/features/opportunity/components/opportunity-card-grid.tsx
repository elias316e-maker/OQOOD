import Link from "next/link";
import type { CSSProperties } from "react";

import type {
  OpportunitySummaryResponse,
} from "../dtos";

type OpportunityCardGridProps = {
  opportunities: OpportunitySummaryResponse[];
};

const typeLabels: Record<
  OpportunitySummaryResponse["type"],
  string
> = {
  RFQ: "طلب عرض سعر",
  RFP: "طلب تقديم عرض",
  TENDER: "منافسة",
  DIRECT_PURCHASE: "شراء مباشر",
  SERVICE_REQUEST: "طلب خدمة",
  SUBCONTRACT: "مقاولة من الباطن",
};

const statusLabels: Record<
  OpportunitySummaryResponse["status"],
  string
> = {
  DRAFT: "مسودة",
  PENDING_APPROVAL: "بانتظار الاعتماد",
  APPROVED: "معتمدة",
  PUBLISHED: "منشورة",
  CLARIFICATION: "الاستفسارات",
  SUBMISSION_CLOSED: "أغلق التقديم",
  TECHNICAL_EVALUATION: "تقييم فني",
  FINANCIAL_EVALUATION: "تقييم مالي",
  NEGOTIATION: "تفاوض",
  AWARD_PENDING: "بانتظار الترسية",
  AWARDED: "تمت الترسية",
  CANCELLED: "ملغاة",
  CLOSED: "مغلقة",
  ARCHIVED: "مؤرشفة",
};

const visibilityLabels: Record<
  OpportunitySummaryResponse["visibility"],
  string
> = {
  PRIVATE: "خاصة",
  INVITED: "بالدعوة",
  PUBLIC: "عامة",
};

function formatDate(value: string | null): string {
  if (!value) return "غير محدد";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "غير محدد";
  return new Intl.DateTimeFormat("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatBudget(
  budget: string | null,
  currency: string,
): string {
  if (!budget) return "غير محددة";
  const value = Number(budget);
  if (!Number.isFinite(value)) return `${budget} ${currency}`;
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function remainingTime(value: string | null) {
  if (!value) {
    return {
      days: "—",
      label: "دون موعد إغلاق",
      progress: 0,
    };
  }

  const milliseconds =
    new Date(value).getTime() - Date.now();
  const days = Math.max(
    0,
    Math.ceil(milliseconds / 86_400_000),
  );

  return {
    days: String(days),
    label:
      milliseconds > 0
        ? "يوم متبقٍ"
        : "انتهى الموعد",
    progress: Math.min(100, Math.max(8, 100 - days * 4)),
  };
}

export function OpportunityCardGrid({
  opportunities,
}: OpportunityCardGridProps) {
  return (
    <div
      className="opportunityCardGrid"
      aria-label="قائمة الفرص والمنافسات"
    >
      {opportunities.map((opportunity) => {
        const remaining = remainingTime(
          opportunity.closingDate,
        );

        return (
          <article
            className="opportunityCompactCard"
            key={opportunity.id}
          >
            <header className="opportunityCompactCard__header">
              <div className="opportunityCompactCard__mark">
                ع
              </div>
              <div>
                <span>{opportunity.number}</span>
                <h2>{opportunity.title}</h2>
              </div>
              <span className="opportunityCompactCard__menu">
                •••
              </span>
            </header>

            <div className="opportunityCompactCard__meta">
              <div
                className="opportunityCountdown"
                style={{
                  "--opportunity-progress":
                    `${remaining.progress}%`,
                } as CSSProperties}
              >
                <strong>{remaining.days}</strong>
                <span>{remaining.label}</span>
              </div>
              <div>
                <span>آخر موعد للتقديم</span>
                <strong>
                  {formatDate(opportunity.closingDate)}
                </strong>
                <small>
                  {visibilityLabels[opportunity.visibility]}
                </small>
              </div>
            </div>

            <dl className="opportunityCompactCard__facts">
              <div>
                <dt>نوع المنافسة</dt>
                <dd>{typeLabels[opportunity.type]}</dd>
              </div>
              <div>
                <dt>الحالة</dt>
                <dd>
                  <span
                    className={
                      `opportunityState opportunityState--` +
                      opportunity.status.toLowerCase()
                    }
                  >
                    {statusLabels[opportunity.status]}
                  </span>
                </dd>
              </div>
              <div>
                <dt>القيمة التقديرية</dt>
                <dd>
                  {formatBudget(
                    opportunity.budget,
                    opportunity.currency,
                  )}
                </dd>
              </div>
              <div>
                <dt>الأولوية</dt>
                <dd>{opportunity.priority}</dd>
              </div>
            </dl>

            <footer className="opportunityCompactCard__footer">
              <Link
                className="opportunityCardAction"
                href={`/platform/opportunities/${opportunity.id}`}
              >
                عرض تفاصيل المنافسة
              </Link>
              <span aria-hidden="true">☆</span>
            </footer>
          </article>
        );
      })}
    </div>
  );
}
