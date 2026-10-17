import styles from "./opportunity-workspace-header.module.css";

import Link from "next/link";
import { Badge, WorkspaceHeader } from "@oqood/design-system";

import type {
  OpportunityResponse,
} from "../../dtos";

import {
  OpportunityWorkspaceCountdown,
} from "./opportunity-workspace-countdown";

type OpportunityWorkspaceHeaderProps = {
  opportunity: Pick<
    OpportunityResponse,
    | "id"
    | "number"
    | "title"
    | "status"
    | "type"
    | "issueDate"
    | "closingDate"
    | "budget"
    | "currency"
    | "category"
    | "visibility"
    | "priority"
  >;
  completionPercentage?: number;
  canUpdate: boolean;
};

const statusLabels: Record<
  OpportunityResponse["status"],
  string
> = {
  DRAFT: "مسودة",
  PENDING_APPROVAL: "بانتظار الاعتماد",
  APPROVED: "معتمدة",
  PUBLISHED: "منشورة",
  CLARIFICATION: "مرحلة الاستفسارات",
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

const typeLabels: Record<
  OpportunityResponse["type"],
  string
> = {
  RFQ: "طلب عرض سعر",
  RFP: "طلب تقديم عرض",
  TENDER: "منافسة",
  DIRECT_PURCHASE: "شراء مباشر",
  SERVICE_REQUEST: "طلب خدمة",
  SUBCONTRACT: "مقاولة من الباطن",
};

const visibilityLabels: Record<
  OpportunityResponse["visibility"],
  string
> = {
  PRIVATE: "خاصة",
  INVITED: "بالدعوة",
  PUBLIC: "عامة",
};

function formatDate(
  value: string | null,
): string {
  if (!value) {
    return "غير محدد";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "غير محدد";
  }

  return new Intl.DateTimeFormat(
    "ar-SA",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    },
  ).format(date);
}

function formatBudget(
  budget: string | null,
  currency: string,
): string {
  if (!budget) {
    return "غير محدد";
  }

  const value = Number(budget);

  if (!Number.isFinite(value)) {
    return `${budget} ${currency}`;
  }

  try {
    return new Intl.NumberFormat(
      "ar-SA",
      {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      },
    ).format(value);
  } catch {
    return `${value.toLocaleString("ar-SA")} ${currency}`;
  }
}

export function OpportunityWorkspaceHeader({
  opportunity,
  completionPercentage = 0,
  canUpdate,
}: OpportunityWorkspaceHeaderProps) {
  const normalizedCompletion = Math.min(
    100,
    Math.max(0, completionPercentage),
  );

  return (
    <header className={styles.header}>
      <div className={styles.top}>
        <div className={styles.breadcrumbs}>
          <Link href="/platform/opportunities">
            المنافسات
          </Link>
          <span aria-hidden="true">‹</span>
          <span>تفاصيل المنافسة</span>
        </div>

        <div className={styles.actions}>

          {canUpdate && (
            <Link
              className="odsButton odsButton--primary odsButton--md"
              href={`/platform/opportunities/${opportunity.id}/edit`}
            >
              تعديل المنافسة
            </Link>
          )}
        </div>
      </div>

      <div className={styles.main}>
        <div className={styles.identity}>
          <WorkspaceHeader
            title={opportunity.title}
            eyebrow="تفاصيل المنافسة"
            badge={
              <Badge tone="neutral">
                {visibilityLabels[opportunity.visibility]}
              </Badge>
            }
          />

          <dl className={styles.meta}>
            <div>
              <dt>رقم المنافسة</dt>
              <dd>{opportunity.number}</dd>
            </div>

            <div>
              <dt>الجهة المالكة</dt>
              <dd>مساحة العمل الحالية</dd>
            </div>

            <div>
              <dt>الإدارة</dt>
              <dd>{opportunity.category ?? "غير محدد"}</dd>
            </div>

            <div>
              <dt>نوع المنافسة</dt>
              <dd>{typeLabels[opportunity.type]}</dd>
            </div>

            <div>
              <dt>تاريخ النشر</dt>
              <dd>{formatDate(opportunity.issueDate)}</dd>
            </div>
          </dl>
        </div>

        <OpportunityWorkspaceCountdown
          closingDate={opportunity.closingDate}
        />

        <div className={styles.status}>
          <div className={styles.statusTop}>
            <span>حالة المنافسة</span>

            <Badge tone="neutral">
              {statusLabels[opportunity.status]}
            </Badge>
          </div>

          <div className={styles.completion}>
            <div>
              <span>نسبة الاكتمال</span>
              <strong>{normalizedCompletion}%</strong>
            </div>

            <div
              className={styles.progress}
              role="progressbar"
              aria-label="نسبة اكتمال المنافسة"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={normalizedCompletion}
            >
              <span
                style={{
                  width: `${normalizedCompletion}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className={styles.summary}>
        <article>
          <span>القيمة التقديرية</span>
          <strong>
            {formatBudget(
              opportunity.budget,
              opportunity.currency,
            )}
          </strong>
        </article>

        <article>
          <span>المرحلة الحالية</span>
          <strong>{statusLabels[opportunity.status]}</strong>
        </article>

        <article>
          <span>الأولوية</span>
          <strong>{opportunity.priority}</strong>
        </article>
      </div>
    </header>
  );
}
