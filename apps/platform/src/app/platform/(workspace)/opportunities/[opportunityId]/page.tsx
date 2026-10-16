import styles from "./overview.module.css";

import { Badge, DashboardPanel, EmptyState, FormGuidance } from "@oqood/design-system";

import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getOpportunityAction,
} from "@/features/opportunity/actions";

import {
  OpportunityLifecycleActions,
} from "@/features/opportunity/components";

import {
  LinkedDocuments,
} from "@/features/documents/linked-documents";

import {
  hasPermission,
  Permissions,
} from "@/lib/permissions";

import {
  requireCurrentWorkspace,
} from "@/lib/workspace-context";

type OpportunityOverviewPageProps = {
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

const lifecycleStages = [
  "مسودة",
  "اعتماد",
  "نشر",
  "استفسارات",
  "استلام العروض",
  "التقييم",
  "الترسية",
] as const;

function formatDate(value: string | null) {
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
) {
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
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value.toLocaleString("ar-SA")} ${currency}`;
  }
}

function resolveLifecycleIndex(
  status: keyof typeof statusLabels,
) {
  const stageMap: Record<
    keyof typeof statusLabels,
    number
  > = {
    DRAFT: 0,
    PENDING_APPROVAL: 1,
    APPROVED: 1,
    PUBLISHED: 2,
    CLARIFICATION: 3,
    SUBMISSION_CLOSED: 4,
    TECHNICAL_EVALUATION: 5,
    FINANCIAL_EVALUATION: 5,
    NEGOTIATION: 5,
    AWARD_PENDING: 5,
    AWARDED: 6,
    CANCELLED: 0,
    CLOSED: 6,
    ARCHIVED: 6,
  };

  return stageMap[status];
}

function calculateHealthScore(opportunity: {
  title: string;
  description: string | null;
  category: string | null;
  budget: string | null;
  issueDate: string | null;
  closingDate: string | null;
}) {
  const checks = [
    Boolean(opportunity.title),
    Boolean(opportunity.description),
    Boolean(opportunity.category),
    Boolean(opportunity.budget),
    Boolean(opportunity.issueDate),
    Boolean(opportunity.closingDate),
  ];

  const completed = checks.filter(Boolean).length;

  return Math.round(
    (completed / checks.length) * 100,
  );
}

export default async function OpportunityOverviewPage({
  params,
}: OpportunityOverviewPageProps) {
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
      <main className={styles.overview}>
        <DashboardPanel>
          <EmptyState
            tone="danger"
            role="alert"
            title="تعذر تحميل المنافسة"
            description={result.message}
            actions={
              <Link
                className="odsButton odsButton--primary odsButton--md"
                href="/platform/opportunities"
              >
                العودة إلى المنافسات
              </Link>
            }
          />
        </DashboardPanel>
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

  const lifecycleIndex =
    resolveLifecycleIndex(opportunity.status);

  const healthScore =
    calculateHealthScore(opportunity);

  const healthItems = [
    {
      label: "البيانات الأساسية",
      completed: Boolean(
        opportunity.title &&
          opportunity.category,
      ),
    },
    {
      label: "الجدول الزمني",
      completed: Boolean(
        opportunity.issueDate &&
          opportunity.closingDate,
      ),
    },
    {
      label: "القيمة التقديرية",
      completed: Boolean(opportunity.budget),
    },
    {
      label: "الوصف والنطاق",
      completed: Boolean(opportunity.description),
    },
  ];

  return (
    <main className={styles.overview}>
      <section className={styles.grid}>
        <div className={styles.column}>
          <DashboardPanel>
            <header className={styles.panelHeader}>
              <div>
                <span className={styles.eyebrow}>
                  دورة حياة المنافسة
                </span>
                <h2>مسار المنافسة</h2>
              </div>

              <Badge tone="neutral">
                {statusLabels[opportunity.status]}
              </Badge>
            </header>

            <div className={styles.lifecycle}>
              {lifecycleStages.map((stage, index) => {
                const completed =
                  index < lifecycleIndex;
                const active =
                  index === lifecycleIndex;

                return (
                  <div
                    className={[
                      styles.stage,
                      completed
                        ? styles.completed
                        : "",
                      active
                        ? styles.active
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    key={stage}
                    aria-current={active ? "step" : undefined}
                  >
                    <span>
                      {completed ? "✓" : index + 1}
                    </span>
                    <strong>{stage}</strong>
                  </div>
                );
              })}
            </div>
          </DashboardPanel>

          <DashboardPanel>
            <header className={styles.panelHeader}>
              <div>
                <span className={styles.eyebrow}>
                  معلومات خاصة
                </span>
                <h2>تفاصيل المنافسة</h2>
              </div>

              <Badge tone="neutral">
                للاستخدام الداخلي
              </Badge>
            </header>

            <dl className={styles.details}>
              <div>
                <dt>رقم المنافسة</dt>
                <dd>{opportunity.number}</dd>
              </div>

              <div>
                <dt>نوع المنافسة</dt>
                <dd>
                  {typeLabels[opportunity.type]}
                </dd>
              </div>

              <div>
                <dt>التصنيف</dt>
                <dd>
                  {opportunity.category ??
                    "غير محدد"}
                </dd>
              </div>

              <div>
                <dt>طريقة الظهور</dt>
                <dd>
                  {
                    visibilityLabels[
                      opportunity.visibility
                    ]
                  }
                </dd>
              </div>

              <div>
                <dt>تاريخ الإصدار</dt>
                <dd>
                  {formatDate(
                    opportunity.issueDate,
                  )}
                </dd>
              </div>

              <div>
                <dt>تاريخ الإغلاق</dt>
                <dd>
                  {formatDate(
                    opportunity.closingDate,
                  )}
                </dd>
              </div>

              <div>
                <dt>تاريخ الإنشاء</dt>
                <dd>
                  {formatDate(
                    opportunity.createdAt,
                  )}
                </dd>
              </div>

              <div>
                <dt>آخر تحديث</dt>
                <dd>
                  {formatDate(
                    opportunity.updatedAt,
                  )}
                </dd>
              </div>
            </dl>
          </DashboardPanel>

          <DashboardPanel>
            <header className={styles.panelHeader}>
              <div>
                <span className={styles.eyebrow}>
                  نطاق المنافسة
                </span>
                <h2>الوصف والمتطلبات</h2>
              </div>

              {canUpdate && (
                <Link
                  className="odsButton odsButton--ghost odsButton--md"
                  href={
                    `/platform/opportunities/` +
                    opportunity.id +
                    "/edit"
                  }
                >
                  تعديل
                </Link>
              )}
            </header>

            <div className={styles.description}>
              {opportunity.description ? (
                <p>{opportunity.description}</p>
              ) : (
                <EmptyState
                  title="لم يضف وصف تفصيلي بعد"
                  description="أضف نطاق العمل والمتطلبات والمخرجات من صفحة تعديل المنافسة."
                />
              )}
            </div>
          </DashboardPanel>

          <DashboardPanel>
            <header className={styles.panelHeader}>
              <div>
                <span className={styles.eyebrow}>
                  معلومات داخلية
                </span>
                <h2>معايير القبول</h2>
              </div>

              <Link
                className="odsButton odsButton--ghost odsButton--md"
                href={
                  `/platform/opportunities/` +
                  opportunity.id +
                  "/criteria"
                }
              >
                إدارة المعايير
              </Link>
            </header>

            <FormGuidance
              title="معايير المنافسة"
              description="افتح صفحة إدارة المعايير للاطلاع على المعايير والأوزان المسجلة لهذه المنافسة وتحديثها حسب صلاحياتك."
            />
          </DashboardPanel>

          <section className={styles.documents}>
            <LinkedDocuments
              canManage={canUpdate}
              entityId={opportunity.id}
              entityType="OPPORTUNITY"
              workspaceId={
                workspaceContext.workspace.id
              }
            />
          </section>
        </div>

        <aside className={styles.column}>
          <DashboardPanel className={styles.health}>
            <header className={styles.panelHeader}>
              <div>
                <span className={styles.eyebrow}>
                  اكتمال البيانات
                </span>
                <h2>جاهزية المنافسة</h2>
              </div>
            </header>

            <div className={styles.score}>
              <div
                className={styles.ring}
                style={{
                  background:
                    `conic-gradient(` +
                    `#35d399 ${healthScore}%, ` +
                    `rgba(112, 122, 157, 0.15) 0)`,
                }}
              >
                <div>
                  <strong>{healthScore}%</strong>
                  <span>مكتملة</span>
                </div>
              </div>
            </div>

            <div className={styles.healthItems}>
              {healthItems.map((item) => (
                <div key={item.label}>
                  <span
                    className={
                      item.completed
                        ? styles.complete
                        : styles.pending
                    }
                  >
                    {item.completed
                      ? "✓"
                      : "!"}
                  </span>
                  <strong>{item.label}</strong>
                </div>
              ))}
            </div>
          </DashboardPanel>

          <DashboardPanel>
            <header className={styles.panelHeader}>
              <div>
                <span className={styles.eyebrow}>
                  المعلومات المالية
                </span>
                <h2>القيمة والميزانية</h2>
              </div>
            </header>

            <dl className={styles.finance}>
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
                <dt>العملة</dt>
                <dd>{opportunity.currency}</dd>
              </div>

              <div>
                <dt>الأولوية</dt>
                <dd>{opportunity.priority}</dd>
              </div>
            </dl>
          </DashboardPanel>

          <DashboardPanel>
            <header className={styles.panelHeader}>
              <div>
                <span className={styles.eyebrow}>
                  الوصول السريع
                </span>
                <h2>إجراءات المنافسة</h2>
              </div>
            </header>

            <div className={styles.actions}>
              <Link
                href={
                  `/platform/opportunities/` +
                  opportunity.id +
                  "/boq"
                }
              >
                جدول الكميات
              </Link>

              <Link
                href={
                  `/platform/opportunities/` +
                  opportunity.id +
                  "/partners"
                }
              >
                الموردون
              </Link>

              <Link
                href={
                  `/platform/opportunities/` +
                  opportunity.id +
                  "/offers"
                }
              >
                العروض
              </Link>

              <Link
                href={
                  `/platform/opportunities/` +
                  opportunity.id +
                  "/attachments"
                }
              >
                المرفقات
              </Link>
            </div>

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
          </DashboardPanel>

          <DashboardPanel>
            <header className={styles.panelHeader}>
              <div>
                <span className={styles.eyebrow}>
                  النشاط الأخير
                </span>
                <h2>سجل المنافسة</h2>
              </div>

              <Link
                href={
                  `/platform/opportunities/` +
                  opportunity.id +
                  "/activity"
                }
              >
                عرض الكل
              </Link>
            </header>

            <div className={styles.activity}>
              <div>
                <span />
                <div>
                  <strong>
                    تم إنشاء المنافسة
                  </strong>
                  <small>
                    {formatDate(
                      opportunity.createdAt,
                    )}
                  </small>
                </div>
              </div>

              <div>
                <span />
                <div>
                  <strong>
                    آخر تحديث للمنافسة
                  </strong>
                  <small>
                    {formatDate(
                      opportunity.updatedAt,
                    )}
                  </small>
                </div>
              </div>

              <div>
                <span />
                <div>
                  <strong>
                    المرحلة الحالية
                  </strong>
                  <small>
                    {
                      statusLabels[
                        opportunity.status
                      ]
                    }
                  </small>
                </div>
              </div>
            </div>
          </DashboardPanel>
        </aside>
      </section>
    </main>
  );
}
