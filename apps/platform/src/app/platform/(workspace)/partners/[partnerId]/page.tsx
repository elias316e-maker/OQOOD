import Link from "next/link";

import {
  notFound,
} from "next/navigation";

import {
  Alert,
  EmptyState,
  FormSection,
  WorkspaceHeader,
} from "@oqood/design-system";

import {
  LinkedDocuments,
} from "@/features/documents/linked-documents";

import {
  hasPermission,
  Permissions,
} from "@/lib/permissions";

import {
  prisma,
} from "@/lib/prisma";

import {
  requireCurrentWorkspace,
} from "@/lib/workspace-context";

import styles from "./partner-scorecard.module.css";

type PartnerScorecardPageProps = {
  params: Promise<{
    partnerId: string;
  }>;
};

const verificationLabels:
  Record<string, string> = {
    UNVERIFIED: "غير موثق",
    PENDING: "قيد التحقق",
    VERIFIED: "موثق",
    REJECTED: "مرفوض",
  };

const contractStatusLabels:
  Record<string, string> = {
    DRAFT: "مسودة",
    PENDING_APPROVAL:
      "بانتظار الاعتماد",
    ACTIVE: "نشط",
    SUSPENDED: "معلّق",
    COMPLETED: "مكتمل",
    TERMINATED: "منتهي",
    CANCELLED: "ملغي",
    ARCHIVED: "مؤرشف",
  };

export default async function PartnerScorecardPage({
  params,
}: PartnerScorecardPageProps) {
  const { partnerId } =
    await params;

  const context =
    await requireCurrentWorkspace();

  if (
    !hasPermission(
      context,
      Permissions.vendors.read,
    )
  ) {
    return (
      <main className={styles.page}>
        <EmptyState
          className={styles.routeState}
          tone="warning"
          icon="!"
          title="لا تملك صلاحية عرض شريك الأعمال"
          description="تواصل مع مسؤول مساحة العمل للحصول على صلاحية الاطلاع على الموردين وشركاء الأعمال."
          role="alert"
          aria-live="polite"
          actions={
            <Link
              className={styles.back}
              href="/platform/partners"
            >
              العودة إلى دليل الشركاء
            </Link>
          }
        />
      </main>
    );
  }

  const partner =
    await prisma.businessPartner.findFirst({
      where: {
        id: partnerId,
        workspaceId:
          context.workspace.id,
      },
      include: {
        contracts: {
          include: {
            milestones: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        evaluations: {
          include: {
            contract: {
              select: {
                number: true,
              },
            },
            createdBy: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

  if (!partner) {
    notFound();
  }

  const evaluations =
    partner.evaluations;

  const average = (
    field:
      | "timelinessScore"
      | "qualityScore"
      | "responsivenessScore"
      | "financialScore",
  ) =>
    evaluations.length > 0
      ? evaluations.reduce(
          (sum, item) =>
            sum +
            Number(item[field]),
          0,
        ) / evaluations.length
      : 0;

  const totalBusiness =
    partner.contracts.reduce(
      (sum, contract) =>
        sum +
        Number(
          contract.totalAmount,
        ),
      0,
    );

  const milestones =
    partner.contracts.flatMap(
      (contract) =>
        contract.milestones,
    );

  const acceptedWithDue =
    milestones.filter(
      (item) =>
        item.acceptedAt &&
        item.dueDate,
    );

  const onTime =
    acceptedWithDue.length > 0
      ? Math.round(
          (
            acceptedWithDue.filter(
              (item) =>
                item.acceptedAt! <=
                item.dueDate!,
            ).length /
            acceptedWithDue.length
          ) * 100,
        )
      : 0;

  // Request time is intentionally used for current operational risk indicators.
  // eslint-disable-next-line react-hooks/purity
  const now = new Date();

  const overdue =
    milestones.filter(
      (item) =>
        item.dueDate &&
        item.dueDate < now &&
        item.status !==
          "ACCEPTED",
    ).length;

  const unpaid =
    milestones.filter(
      (item) =>
        item.paymentStatus ===
        "CLAIMED",
    ).length;

  const money =
    new Intl.NumberFormat(
      "ar-SA",
      {
        style: "currency",
        currency:
          context.workspace
            .defaultCurrency,
        maximumFractionDigits: 0,
      },
    );

  const dimensions = [
    [
      "الالتزام بالمواعيد",
      average(
        "timelinessScore",
      ),
    ],
    [
      "جودة التسليم",
      average("qualityScore"),
    ],
    [
      "الاستجابة",
      average(
        "responsivenessScore",
      ),
    ],
    [
      "الأداء المالي",
      average("financialScore"),
    ],
  ] as const;

  const trustScore =
    partner.trustScore === null
      ? null
      : Number(
          partner.trustScore,
        );

  const verificationLabel =
    verificationLabels[
      partner.verificationStatus
    ] ??
    partner.verificationStatus;

  return (
    <main className={styles.page}>
      <WorkspaceHeader
        className={styles.header}
        eyebrow="بطاقة أداء المورد"
        title={partner.nameAr}
        description={`${
          partner.commercialRegister ??
          "دون سجل تجاري"
        } · ${
          partner.city ??
          "المدينة غير محددة"
        }`}
        actions={
          <div
            className={
              styles.headerActions
            }
          >
            <span
              className={
                styles.verificationBadge
              }
              data-status={
                partner.verificationStatus
              }
            >
              {verificationLabel}
            </span>

            <Link
              className={styles.back}
              href="/platform/partners"
            >
              العودة إلى الموردين
            </Link>
          </div>
        }
      />

      <section
        aria-label="ملخص أداء شريك الأعمال"
        className={styles.kpis}
      >
        <article>
          <span>مؤشر الثقة</span>

          <strong>
            {trustScore === null
              ? "—"
              : `${trustScore} / 100`}
          </strong>

          <small>
            التقييم الإجمالي
          </small>
        </article>

        <article>
          <span>قيمة الأعمال</span>

          <strong>
            {money.format(
              totalBusiness,
            )}
          </strong>

          <small>
            عبر جميع العقود
          </small>
        </article>

        <article>
          <span>العقود</span>

          <strong>
            {partner.contracts.length}
          </strong>

          <small>
            عقود مرتبطة بالشريك
          </small>
        </article>

        <article
          data-tone={
            onTime < 80 &&
            acceptedWithDue.length > 0
              ? "warning"
              : "normal"
          }
        >
          <span>
            الالتزام بالمواعيد
          </span>

          <strong>{onTime}%</strong>

          <small>
            من المراحل المقبولة
          </small>
        </article>
      </section>

      <FormSection
        className={styles.panel}
        eyebrow="مؤشرات التقييم"
        title="متوسط محاور الأداء"
        description="متوسط نتائج تقييمات العقود المسجلة لهذا الشريك."
        actions={
          <small
            className={
              styles.sectionMeta
            }
          >
            {evaluations.length} تقييم
          </small>
        }
      >
        {evaluations.length > 0 ? (
          <div
            className={styles.scores}
            role="list"
          >
            {dimensions.map(
              ([label, value]) => {
                const percentage =
                  Math.min(
                    100,
                    Math.max(
                      0,
                      value * 20,
                    ),
                  );

                const score =
                  Math.min(
                    5,
                    Math.max(
                      0,
                      Number(
                        value.toFixed(
                          1,
                        ),
                      ),
                    ),
                  );

                return (
                  <article
                    className={
                      styles.score
                    }
                    key={label}
                    role="listitem"
                  >
                    <div
                      className={
                        styles.scoreHeader
                      }
                    >
                      <span>
                        {label}
                      </span>

                      <strong>
                        {value.toFixed(
                          1,
                        )}
                        {" / 5"}
                      </strong>
                    </div>

                    <div
                      aria-label={`${label}: ${value.toFixed(1)} من 5`}
                      aria-valuemax={5}
                      aria-valuemin={0}
                      aria-valuenow={
                        score
                      }
                      className={
                        styles.progressTrack
                      }
                      role="progressbar"
                    >
                      <span
                        className={
                          styles.progressFill
                        }
                        style={{
                          width:
                            `${percentage}%`,
                        }}
                      />
                    </div>
                  </article>
                );
              },
            )}
          </div>
        ) : (
          <EmptyState
            className={
              styles.compactEmpty
            }
            icon="★"
            title="لا توجد تقييمات مسجلة"
            description="ستظهر مؤشرات الأداء بعد إضافة أول تقييم مرتبط بعقد لهذا الشريك."
            role="status"
          />
        )}
      </FormSection>

      <FormSection
        className={styles.panel}
        eyebrow="المتابعة التشغيلية"
        title="المخاطر والتنبيهات"
        description="مراحل التنفيذ والمطالبات التي قد تحتاج إلى متابعة."
      >
        {overdue > 0 ||
        unpaid > 0 ? (
          <div
            className={styles.risks}
          >
            {overdue > 0 ? (
              <Alert
                className={
                  styles.riskAlert
                }
                tone="danger"
                title={`${overdue} مرحلة تنفيذ متأخرة`}
              >
                راجع العقود والمراحل
                المتأخرة واتخذ الإجراء
                التشغيلي المناسب.
              </Alert>
            ) : null}

            {unpaid > 0 ? (
              <Alert
                className={
                  styles.riskAlert
                }
                tone="warning"
                title={`${unpaid} مطالبة مالية غير مسددة`}
              >
                توجد مطالبات بحالة
                CLAIMED لم تُسجل كمدفوعة
                بعد.
              </Alert>
            ) : null}
          </div>
        ) : (
          <EmptyState
            className={
              styles.compactEmpty
            }
            tone="success"
            icon="✓"
            title="لا توجد مخاطر تشغيلية حالية"
            description="لا توجد مراحل متأخرة أو مطالبات مالية معلقة لهذا الشريك."
            role="status"
          />
        )}
      </FormSection>

      <FormSection
        className={styles.panel}
        eyebrow="السجل التعاقدي"
        title="تاريخ العقود"
        description="العقود المرتبطة بالشريك وقيمتها وعدد مراحل التنفيذ."
        actions={
          <small
            className={
              styles.sectionMeta
            }
          >
            {partner.contracts.length}
            {" عقد"}
          </small>
        }
      >
        {partner.contracts.length >
        0 ? (
          <div
            className={
              styles.tableWrap
            }
          >
            <table
              className={styles.table}
            >
              <caption
                className={
                  styles.srOnly
                }
              >
                عقود شريك الأعمال
              </caption>

              <thead>
                <tr>
                  <th scope="col">
                    العقد
                  </th>

                  <th scope="col">
                    الحالة
                  </th>

                  <th scope="col">
                    القيمة
                  </th>

                  <th scope="col">
                    المراحل
                  </th>
                </tr>
              </thead>

              <tbody>
                {partner.contracts.map(
                  (contract) => (
                    <tr
                      key={contract.id}
                    >
                      <td>
                        <div
                          className={
                            styles.contractIdentity
                          }
                        >
                          <Link
                            href={`/platform/contracts/${contract.id}`}
                          >
                            {contract.number}
                          </Link>

                          <small>
                            {contract.title}
                          </small>
                        </div>
                      </td>

                      <td>
                        <span
                          className={
                            styles.status
                          }
                          data-status={
                            contract.status
                          }
                        >
                          {contractStatusLabels[
                            contract.status
                          ] ??
                            contract.status}
                        </span>
                      </td>

                      <td>
                        {money.format(
                          Number(
                            contract.totalAmount,
                          ),
                        )}
                      </td>

                      <td>
                        {
                          contract
                            .milestones
                            .length
                        }
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            className={
              styles.compactEmpty
            }
            icon="▣"
            title="لا توجد عقود مرتبطة"
            description="لم يتم تسجيل أي عقد مرتبط بشريك الأعمال حتى الآن."
            role="status"
          />
        )}
      </FormSection>

      <FormSection
        className={styles.panel}
        eyebrow="التقييمات السابقة"
        title="سجل التقييمات"
        description="نتائج التقييم والمقيّم وتاريخ التسجيل لكل عقد."
        actions={
          <small
            className={
              styles.sectionMeta
            }
          >
            {evaluations.length}
            {" تقييم"}
          </small>
        }
      >
        {evaluations.length > 0 ? (
          <div
            className={
              styles.tableWrap
            }
          >
            <table
              className={styles.table}
            >
              <caption
                className={
                  styles.srOnly
                }
              >
                تقييمات شريك الأعمال
              </caption>

              <thead>
                <tr>
                  <th scope="col">
                    العقد
                  </th>

                  <th scope="col">
                    النتيجة
                  </th>

                  <th scope="col">
                    المقيّم
                  </th>

                  <th scope="col">
                    التاريخ
                  </th>
                </tr>
              </thead>

              <tbody>
                {evaluations.map(
                  (evaluation) => (
                    <tr
                      key={evaluation.id}
                    >
                      <td>
                        {
                          evaluation
                            .contract
                            .number
                        }
                      </td>

                      <td>
                        <span
                          className={
                            styles.scoreBadge
                          }
                        >
                          {evaluation.overallScore.toString()}
                          {" / 5"}
                        </span>
                      </td>

                      <td>
                        {
                          evaluation
                            .createdBy
                            .name
                        }
                      </td>

                      <td>
                        <time
                          dateTime={evaluation.createdAt.toISOString()}
                        >
                          {new Intl.DateTimeFormat(
                            "ar-SA",
                            {
                              dateStyle:
                                "medium",
                            },
                          ).format(
                            evaluation.createdAt,
                          )}
                        </time>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            className={
              styles.compactEmpty
            }
            icon="☆"
            title="لا يوجد سجل تقييمات"
            description="لم يُسجل أي تقييم أداء لهذا الشريك حتى الآن."
            role="status"
          />
        )}
      </FormSection>

      <LinkedDocuments
        canManage={hasPermission(
          context,
          Permissions.vendors.update,
        )}
        entityId={partner.id}
        entityType="BUSINESS_PARTNER"
        workspaceId={
          context.workspace.id
        }
      />
    </main>
  );
}
