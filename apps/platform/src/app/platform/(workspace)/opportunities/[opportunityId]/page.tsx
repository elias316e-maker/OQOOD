import Link from "next/link";
import { notFound } from "next/navigation";

import {
  hasPermission,
  Permissions,
} from "@/lib/permissions";

import {
  requireCurrentWorkspace,
} from "@/lib/workspace-context";


import {
  getOpportunityAction,
} from "@/features/opportunity/actions";

import {
  OpportunityLifecycleActions,
} from "@/features/opportunity/components";


type OpportunityDetailsPageProps = {
  params: Promise<{
    opportunityId: string;
  }>;
};

const typeLabels = {
  RFQ: "طلب عرض سعر",
  RFP: "طلب تقديم عرض",
  TENDER: "منافسة",
  DIRECT_PURCHASE: "شراء مباشر",
  SERVICE_REQUEST: "طلب خدمة",
  SUBCONTRACT: "مقاولة من الباطن",
} as const;

const statusLabels = {
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
} as const;

const visibilityLabels = {
  PRIVATE: "خاصة",
  INVITED: "بالدعوة",
  PUBLIC: "عامة",
} as const;

function formatDate(value: string | null): string {
  if (!value) {
    return "غير محدد";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "غير محدد";
  }

  return new Intl.DateTimeFormat("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
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
    return new Intl.NumberFormat("ar-SA", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toLocaleString("ar-SA")} ${currency}`;
  }
}

export default async function OpportunityDetailsPage({
  params,
}: OpportunityDetailsPageProps) {
  const { opportunityId } = await params;

  const [result, workspaceContext] =
    await Promise.all([
      getOpportunityAction({
        opportunityId,
      }),
      requireCurrentWorkspace(),
    ]);

  if (!result.success) {
    if (
      result.message.includes("غير موجود") ||
      result.message.includes("لم يتم العثور")
    ) {
      notFound();
    }

    return (
      <main className="platformContent">
        <section className="dashboardPanel">
          <div
            className="emptyState"
            role="alert"
            aria-live="polite"
          >
            <h1>تعذر تحميل الفرصة</h1>
            <p>{result.message}</p>

            <Link
              className="primaryButton compactButton"
              href="/platform/opportunities"
            >
              العودة إلى قائمة الفرص
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const opportunity = result.data;

  const canUpdate = hasPermission(
    workspaceContext,
    Permissions.opportunities.update,
  );

  const canPublish = hasPermission(
    workspaceContext,
    Permissions.opportunities.publish,
  );

  const canArchive = hasPermission(
    workspaceContext,
    Permissions.opportunities.delete,
  );

  return (
    <main className="platformContent">
      <section className="listPageHeader">
        <div>
          <span className="pageEyebrow">
            تفاصيل الفرصة
          </span>

          <h1>{opportunity.title}</h1>

          <p>
            {opportunity.number} —{" "}
            {typeLabels[opportunity.type]}
          </p>
        </div>

        <div className="commandHeaderActions">
          <Link
            className="secondaryButton compactButton"
            href="/platform/opportunities"
          >
            العودة للقائمة
          </Link>

          {canUpdate &&
            opportunity.status !== "ARCHIVED" && (
            <Link
              className="secondaryButton compactButton"
              href={
                `/platform/opportunities/` +
                opportunity.id +
                "/edit"
              }
            >
              تعديل الفرصة
            </Link>
          )}

          <OpportunityLifecycleActions
            opportunity={{
              id: opportunity.id,
              number: opportunity.number,
              status: opportunity.status,
              closingDate:
                opportunity.closingDate,
            }}
            canPublish={canPublish}
            canArchive={canArchive}
          />
        </div>
      </section>

      <section className="listSummaryCards">
        <article>
          <span>الحالة</span>
          <strong>
            {statusLabels[opportunity.status]}
          </strong>
          <small>
            آخر تحديث:{" "}
            {formatDate(opportunity.updatedAt)}
          </small>
        </article>

        <article>
          <span>النوع</span>
          <strong>
            {typeLabels[opportunity.type]}
          </strong>
          <small>
            الظهور:{" "}
            {visibilityLabels[
              opportunity.visibility
            ]}
          </small>
        </article>

        <article>
          <span>تاريخ الإغلاق</span>
          <strong>
            {formatDate(
              opportunity.closingDate,
            )}
          </strong>
          <small>
            الإصدار:{" "}
            {formatDate(
              opportunity.issueDate,
            )}
          </small>
        </article>

        <article>
          <span>القيمة التقديرية</span>
          <strong>
            {formatBudget(
              opportunity.budget,
              opportunity.currency,
            )}
          </strong>
          <small>
            الأولوية:{" "}
            {opportunity.priority}
          </small>
        </article>
      </section>

      <section className="dashboardPanel">
        <div className="detailGrid">
          <article>
            <span>رقم الفرصة</span>
            <strong>
              {opportunity.number}
            </strong>
          </article>

          <article>
            <span>الفئة</span>
            <strong>
              {opportunity.category ??
                "غير محددة"}
            </strong>
          </article>

          <article>
            <span>المشروع</span>
            <strong>
              {opportunity.projectId
                ? "مرتبطة بمشروع"
                : "غير مرتبطة"}
            </strong>
          </article>

          <article>
            <span>تاريخ الإنشاء</span>
            <strong>
              {formatDate(
                opportunity.createdAt,
              )}
            </strong>
          </article>
        </div>
      </section>

      <section className="dashboardPanel">
        <div className="panelHeader">
          <div>
            <span className="pageEyebrow">
              الوصف
            </span>
            <h2>تفاصيل ونطاق الفرصة</h2>
          </div>
        </div>

        <div className="detailDescription">
          {opportunity.description ? (
            <p>{opportunity.description}</p>
          ) : (
            <p>
              لم تتم إضافة وصف تفصيلي لهذه
              الفرصة بعد.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
