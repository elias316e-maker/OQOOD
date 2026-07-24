import Link from "next/link";

import {
  SortableOpportunityTable,
} from "@/features/opportunity/components";


import {
  listWorkspaceOpportunitiesAction,
} from "@/features/opportunity/actions/list-workspace-opportunities";

import type {
  OpportunitySummaryResponse,
} from "@/features/opportunity/dtos";

import {
  hasPermission,
  Permissions,
} from "@/lib/permissions";

import {
  requireCurrentWorkspace,
} from "@/lib/workspace-context";

type OpportunityStatus =
  OpportunitySummaryResponse["status"];

type OpportunityType =
  OpportunitySummaryResponse["type"];

const typeLabels: Record<
  OpportunityType,
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
  OpportunityStatus,
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

const statusClasses: Record<
  OpportunityStatus,
  string
> = {
  DRAFT: "neutral",
  PENDING_APPROVAL: "warning",
  APPROVED: "info",
  PUBLISHED: "success",
  CLARIFICATION: "info",
  SUBMISSION_CLOSED: "neutral",
  TECHNICAL_EVALUATION: "warning",
  FINANCIAL_EVALUATION: "warning",
  NEGOTIATION: "warning",
  AWARD_PENDING: "warning",
  AWARDED: "success",
  CANCELLED: "danger",
  CLOSED: "neutral",
  ARCHIVED: "neutral",
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
      month: "short",
      day: "numeric",
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
        maximumFractionDigits: 2,
      },
    ).format(value);
  } catch {
    return `${value.toLocaleString("ar-SA")} ${currency}`;
  }
}

function countByStatuses(
  opportunities: readonly OpportunitySummaryResponse[],
  statuses: readonly OpportunityStatus[],
): number {
  const acceptedStatuses =
    new Set<OpportunityStatus>(statuses);

  return opportunities.filter(
    (opportunity) =>
      acceptedStatuses.has(
        opportunity.status,
      ),
  ).length;
}

export default async function OpportunitiesPage() {
  const [
    result,
    workspaceContext,
  ] = await Promise.all([
    listWorkspaceOpportunitiesAction({
      page: 1,
      pageSize: 50,
    }),
    requireCurrentWorkspace(),
  ]);

  const canCreate = hasPermission(
    workspaceContext,
    Permissions.opportunities.create,
  );

  if (!result.success) {
    return (
      <main className="platformContent">
        <section
          className="dashboardPanel"
          role="alert"
        >
          <div className="emptyState">
            <h1>تعذر تحميل الفرص</h1>
            <p>{result.message}</p>

            <Link
              className="primaryButton compactButton"
              href="/platform/opportunities"
            >
              إعادة المحاولة
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const {
    items: opportunities,
    total,
    page,
    totalPages,
  } = result.data;

  const openCount = countByStatuses(
    opportunities,
    [
      "APPROVED",
      "PUBLISHED",
      "CLARIFICATION",
    ],
  );

  const evaluationCount = countByStatuses(
    opportunities,
    [
      "TECHNICAL_EVALUATION",
      "FINANCIAL_EVALUATION",
      "NEGOTIATION",
      "AWARD_PENDING",
    ],
  );

  const awardedCount = countByStatuses(
    opportunities,
    ["AWARDED"],
  );

  return (
    <main className="platformContent">


      <section className="listPageHeader">
        <div>
          <span className="pageEyebrow">
            إدارة الفرص
          </span>

          <h1>الفرص والمنافسات</h1>

          <p>
            أنشئ وتابع طلبات الأسعار
            والعروض والمنافسات من مكان واحد.
          </p>
        </div>

        {canCreate && (
          <Link
            className="primaryButton compactButton"
            href="/platform/opportunities/new"
          >
            + إنشاء فرصة جديدة
          </Link>
        )}
      </section>

      <section
        className="listSummaryCards"
        aria-label="ملخص الفرص"
      >
        <article>
          <span>إجمالي الفرص</span>
          <strong>{total}</strong>
          <small>
            داخل مساحة العمل الحالية
          </small>
        </article>

        <article>
          <span>الفرص المفتوحة</span>
          <strong>{openCount}</strong>
          <small className="positive">
            نشطة حاليًا
          </small>
        </article>

        <article>
          <span>تحت التقييم</span>
          <strong>
            {evaluationCount}
          </strong>
          <small>تحتاج متابعة</small>
        </article>

        <article>
          <span>تمت الترسية</span>
          <strong>{awardedCount}</strong>
          <small>لا توجد قيمة مسجلة</small>
        </article>
      </section>

      <section className="dashboardPanel opportunityListPanel">

        {opportunities.length === 0 ? (
          <div
            className="emptyState"
            role="status"
          >
            <h2>
              لا توجد فرص حتى الآن
            </h2>

            <p>
              لم تُنشأ أي فرصة داخل
              مساحة العمل الحالية.
            </p>

            {canCreate && (
              <Link
                className="primaryButton compactButton"
                href="/platform/opportunities/new"
              >
                إنشاء فرصة جديدة
              </Link>
            )}
          </div>
        ) : (
          <>
            <SortableOpportunityTable
              opportunities={opportunities}
            />

            <div
              className="tablePagination"
              aria-label="ملخص نتائج الفرص"
            >
              <span>
                الصفحة {page} من{" "}
                {Math.max(totalPages, 1)}
              </span>

              <span>
                إجمالي النتائج: {total}
              </span>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
