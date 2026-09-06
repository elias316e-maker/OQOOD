import Link from "next/link";
import {
  notFound,
} from "next/navigation";

import {
  Alert,
  EmptyState,
  FormActions,
  FormSection,
  WorkspaceHeader,
} from "@oqood/design-system";

import {
  LinkedDocuments,
} from "@/features/documents/linked-documents";

import {
  updateProjectStatusAction,
} from "@/features/projects/actions";

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

import listStyles from "../projects.module.css";
import styles from "./project-details.module.css";

const statusLabels = {
  PLANNED: "مخطط",
  ACTIVE: "نشط",
  ON_HOLD: "متوقف مؤقتًا",
  COMPLETED: "مكتمل",
  CANCELLED: "ملغي",
} as const;

type ProjectDetailsPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function ProjectDetailsPage({
  params,
}: ProjectDetailsPageProps) {
  const { projectId } = await params;

  const context =
    await requireCurrentWorkspace();

  if (
    !hasPermission(
      context,
      Permissions.workspace.read,
    )
  ) {
    return (
      <main className={listStyles.page}>
        <EmptyState
          className={listStyles.panel}
          tone="warning"
          icon="!"
          title="لا تملك صلاحية عرض المشروع"
          description="تواصل مع مسؤول مساحة العمل للحصول على صلاحية الاطلاع على بيانات المشروع."
          role="alert"
          actions={
            <Link
              className={
                listStyles.backButton
              }
              href="/platform/projects"
            >
              العودة إلى المشاريع
            </Link>
          }
        />
      </main>
    );
  }

  const project =
    await prisma.project.findFirst({
      where: {
        id: projectId,
        workspaceId:
          context.workspace.id,
      },
      include: {
        procurementRequests: {
          orderBy: {
            updatedAt: "desc",
          },
          take: 10,
        },
        opportunities: {
          orderBy: {
            updatedAt: "desc",
          },
          take: 10,
        },
        contracts: {
          include: {
            businessPartner: {
              select: {
                nameAr: true,
              },
            },
            milestones: true,
          },
          orderBy: {
            updatedAt: "desc",
          },
        },
      },
    });

  if (!project) {
    notFound();
  }

  const projectCurrency =
    project.currency;

  const canManage = hasPermission(
    context,
    Permissions.workspace.update,
  );

  const canReadProcurement =
    hasPermission(
      context,
      Permissions.procurement.read,
    );

  const canReadOpportunities =
    hasPermission(
      context,
      Permissions.opportunities.read,
    );

  const canReadContracts =
    hasPermission(
      context,
      Permissions.contracts.read,
    );

  const committed =
    project.contracts.reduce(
      (sum, contract) =>
        sum +
        Number(contract.totalAmount),
      0,
    );

  const estimated =
    project.procurementRequests.reduce(
      (sum, request) =>
        sum +
        Number(
          request.estimatedTotal ?? 0,
        ),
      0,
    );

  const milestones =
    project.contracts.flatMap(
      (contract) =>
        contract.milestones,
    );

  const progress =
    milestones.length > 0
      ? Math.round(
          milestones.reduce(
            (sum, milestone) =>
              sum + milestone.progress,
            0,
          ) / milestones.length,
        )
      : project.status === "COMPLETED"
        ? 100
        : 0;

  const utilization =
    Number(project.budget)
      ? Math.round(
          (committed /
            Number(project.budget)) *
            100,
        )
      : 0;

  function money(
    value: number,
  ): string {
    return new Intl.NumberFormat(
      "ar-SA",
      {
        style: "currency",
        currency: projectCurrency,
        maximumFractionDigits: 0,
      },
    ).format(value);
  }

  function date(
    value: Date | null,
  ): string {
    return value
      ? new Intl.DateTimeFormat(
          "ar-SA",
          {
            dateStyle: "medium",
          },
        ).format(value)
      : "غير محدد";
  }

  return (
    <main className={listStyles.page}>
      <WorkspaceHeader
        className={listStyles.header}
        eyebrow={project.code}
        title={project.nameAr}
        description={
          project.description ??
          "لا يوجد وصف تفصيلي للمشروع."
        }
        badge={
          statusLabels[project.status]
        }
        actions={
          <Link
            className={
              listStyles.backButton
            }
            href="/platform/projects"
          >
            العودة إلى المشاريع
          </Link>
        }
      />

      <nav
        aria-label="أقسام المشروع"
        className={styles.detailNav}
      >
        <a href="#overview">
          نظرة عامة
        </a>

        {canReadProcurement ? (
          <a href="#procurement">
            المشتريات
          </a>
        ) : null}

        {canReadOpportunities ? (
          <a href="#opportunities">
            المنافسات
          </a>
        ) : null}

        {canReadContracts ? (
          <a href="#contracts">
            العقود والتنفيذ
          </a>
        ) : null}

        <a href="#documents">
          المستندات
        </a>
      </nav>

      <section
        aria-label="ملخص المشروع"
        className={styles.hero}
        id="overview"
      >
        <div>
          <span>حالة المشروع</span>
          <strong>
            {statusLabels[project.status]}
          </strong>
          <small>
            {date(project.startDate)}
            {" — "}
            {date(project.endDate)}
          </small>
        </div>

        <div>
          <span>الميزانية</span>
          <strong>
            {project.budget
              ? money(
                  Number(
                    project.budget,
                  ),
                )
              : "غير محددة"}
          </strong>
          <small>
            المرتبط {money(committed)}
          </small>
        </div>

        <div>
          <span>نسبة الإنجاز</span>
          <strong>{progress}%</strong>
          <i aria-hidden="true">
            <b
              style={{
                width: `${progress}%`,
              }}
            />
          </i>
        </div>

        <div
          data-tone={
            utilization > 100
              ? "danger"
              : "normal"
          }
        >
          <span>
            استخدام الميزانية
          </span>

          <strong>
            {utilization}%
          </strong>

          <small>
            {money(
              Math.max(
                0,
                Number(
                  project.budget ?? 0,
                ) - committed,
              ),
            )}{" "}
            متبقٍ
          </small>
        </div>
      </section>

      {utilization > 100 ? (
        <Alert
          className={
            styles.budgetAlert
          }
          tone="danger"
          title="تجاوز الارتباطات التعاقدية ميزانية المشروع"
          aria-live="polite"
        >
          تبلغ الارتباطات التعاقدية{" "}
          {money(committed)} مقابل
          ميزانية{" "}
          {project.budget
            ? money(
                Number(
                  project.budget,
                ),
              )
            : "غير محددة"}.
        </Alert>
      ) : null}

      {canManage ? (
        <FormActions
          className={styles.statusBar}
          status={
            <>
              <strong>
                تحديث حالة المشروع
              </strong>
              <span>
                الحالة الحالية:{" "}
                {
                  statusLabels[
                    project.status
                  ]
                }
              </span>
            </>
          }
        >
          {Object.entries(
            statusLabels,
          )
            .filter(
              ([status]) =>
                status !==
                project.status,
            )
            .map(
              ([status, label]) => (
                <form
                  action={
                    updateProjectStatusAction
                  }
                  key={status}
                >
                  <input
                    name="projectId"
                    type="hidden"
                    value={project.id}
                  />

                  <input
                    name="status"
                    type="hidden"
                    value={status}
                  />

                  <button type="submit">
                    {label}
                  </button>
                </form>
              ),
            )}
        </FormActions>
      ) : null}

      <section
        aria-label="مؤشرات عمليات المشروع"
        className={styles.metrics}
      >
        <article>
          <span>
            طلبات المشتريات
          </span>
          <strong>
            {
              project
                .procurementRequests
                .length
            }
          </strong>
          <small>
            {money(estimated)} قيمة
            تقديرية
          </small>
        </article>

        <article>
          <span>المنافسات</span>
          <strong>
            {
              project.opportunities
                .length
            }
          </strong>
          <small>
            {
              project.opportunities.filter(
                (item) =>
                  item.status ===
                  "PUBLISHED",
              ).length
            }{" "}
            منشورة
          </small>
        </article>

        <article>
          <span>العقود</span>
          <strong>
            {project.contracts.length}
          </strong>
          <small>
            {
              project.contracts.filter(
                (item) =>
                  item.status ===
                  "ACTIVE",
              ).length
            }{" "}
            سارية
          </small>
        </article>

        <article>
          <span>مراحل التنفيذ</span>
          <strong>
            {milestones.length}
          </strong>
          <small>
            {
              milestones.filter(
                (item) =>
                  item.status ===
                  "ACCEPTED",
              ).length
            }{" "}
            مقبولة
          </small>
        </article>
      </section>

      <div className={styles.columns}>
        {canReadProcurement ? (
          <FormSection
            className={styles.panel}
            eyebrow="المشتريات"
            title="طلبات المشتريات"
            id="procurement"
            actions={
              <Link href="/platform/procurement">
                عرض الكل
              </Link>
            }
          >
            {project.procurementRequests
              .length > 0 ? (
              <div className={styles.rows}>
                {project.procurementRequests.map(
                  (request) => (
                    <Link
                      href={`/platform/procurement/${request.id}`}
                      key={request.id}
                    >
                      <div>
                        <strong>
                          {request.title}
                        </strong>
                        <span>
                          {request.number}
                        </span>
                      </div>

                      <b>
                        {request.status}
                      </b>
                    </Link>
                  ),
                )}
              </div>
            ) : (
              <EmptyState
                className={
                  styles.compactEmpty
                }
                icon="▦"
                title="لا توجد طلبات مشتريات مرتبطة"
                description="لا توجد طلبات مرتبطة بهذا المشروع حتى الآن."
                role="status"
              />
            )}
          </FormSection>
        ) : null}

        {canReadOpportunities ? (
          <FormSection
            className={styles.panel}
            eyebrow="الفرص والمنافسات"
            title="المنافسات"
            id="opportunities"
            actions={
              <Link href="/platform/opportunities">
                عرض الكل
              </Link>
            }
          >
            {project.opportunities.length >
            0 ? (
              <div className={styles.rows}>
                {project.opportunities.map(
                  (opportunity) => (
                    <Link
                      href={`/platform/opportunities/${opportunity.id}`}
                      key={opportunity.id}
                    >
                      <div>
                        <strong>
                          {
                            opportunity.title
                          }
                        </strong>
                        <span>
                          {
                            opportunity.number
                          }
                        </span>
                      </div>

                      <b>
                        {
                          opportunity.status
                        }
                      </b>
                    </Link>
                  ),
                )}
              </div>
            ) : (
              <EmptyState
                className={
                  styles.compactEmpty
                }
                icon="◇"
                title="لا توجد منافسات مرتبطة"
                description="لا توجد منافسات مرتبطة بهذا المشروع حتى الآن."
                role="status"
              />
            )}
          </FormSection>
        ) : null}
      </div>

      {canReadContracts ? (
        <FormSection
          className={styles.panel}
          eyebrow="العقود والتنفيذ"
          title="العقود والتنفيذ"
          id="contracts"
          actions={
            <Link href="/platform/contracts">
              عرض العقود
            </Link>
          }
        >
          {project.contracts.length >
          0 ? (
            <div
              className={
                styles.contracts
              }
            >
              {project.contracts.map(
                (contract) => {
                  const contractProgress =
                    contract.milestones
                      .length > 0
                      ? Math.round(
                          contract.milestones.reduce(
                            (
                              sum,
                              milestone,
                            ) =>
                              sum +
                              milestone.progress,
                            0,
                          ) /
                            contract
                              .milestones
                              .length,
                        )
                      : 0;

                  return (
                    <Link
                      href={`/platform/contracts/${contract.id}`}
                      key={contract.id}
                    >
                      <div>
                        <strong>
                          {contract.title}
                        </strong>
                        <span>
                          {contract.number}
                          {" · "}
                          {
                            contract
                              .businessPartner
                              .nameAr
                          }
                        </span>
                      </div>

                      <div>
                        <b>
                          {money(
                            Number(
                              contract.totalAmount,
                            ),
                          )}
                        </b>

                        <i
                          aria-hidden="true"
                        >
                          <em
                            style={{
                              width:
                                `${contractProgress}%`,
                            }}
                          />
                        </i>

                        <small>
                          {
                            contractProgress
                          }
                          %
                        </small>
                      </div>
                    </Link>
                  );
                },
              )}
            </div>
          ) : (
            <EmptyState
              className={
                styles.compactEmpty
              }
              icon="▣"
              title="لا توجد عقود مرتبطة"
              description="لا توجد عقود مرتبطة بهذا المشروع حتى الآن."
              role="status"
            />
          )}
        </FormSection>
      ) : null}

      <LinkedDocuments
        canManage={canManage}
        entityId={project.id}
        entityType="PROJECT"
        workspaceId={
          context.workspace.id
        }
      />
    </main>
  );
}
