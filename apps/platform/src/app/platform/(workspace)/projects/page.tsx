import Link from "next/link";

import {
  EmptyState,
  FormSection,
  WorkspaceHeader,
} from "@oqood/design-system";

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

import styles from "./projects.module.css";

const statusLabels = {
  PLANNED: "مخطط",
  ACTIVE: "نشط",
  ON_HOLD: "متوقف مؤقتًا",
  COMPLETED: "مكتمل",
  CANCELLED: "ملغي",
} as const;

export default async function ProjectsPage() {
  const context =
    await requireCurrentWorkspace();

  if (
    !hasPermission(
      context,
      Permissions.workspace.read,
    )
  ) {
    return (
      <main className={styles.page}>
        <EmptyState
          className={styles.panel}
          tone="warning"
          icon="!"
          title="لا تملك صلاحية عرض المشاريع"
          description="تواصل مع مسؤول مساحة العمل للحصول على صلاحية الاطلاع على محفظة المشاريع."
          role="alert"
          aria-live="polite"
        />
      </main>
    );
  }

  const projects =
    await prisma.project.findMany({
      where: {
        workspaceId: context.workspace.id,
      },
      include: {
        procurementRequests: {
          select: {
            estimatedTotal: true,
          },
        },
        opportunities: {
          select: {
            id: true,
          },
        },
        contracts: {
          select: {
            totalAmount: true,
            milestones: {
              select: {
                progress: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

  const canCreate = hasPermission(
    context,
    Permissions.workspace.update,
  );

  const totalBudget = projects.reduce(
    (sum, project) =>
      sum + Number(project.budget ?? 0),
    0,
  );

  const committed = projects
    .flatMap(
      (project) => project.contracts,
    )
    .reduce(
      (sum, contract) =>
        sum + Number(contract.totalAmount),
      0,
    );

  const active = projects.filter(
    (project) =>
      project.status === "ACTIVE",
  ).length;

  const averageProgress =
    projects.length > 0
      ? Math.round(
          projects.reduce(
            (sum, project) => {
              const milestones =
                project.contracts.flatMap(
                  (contract) =>
                    contract.milestones,
                );

              const projectProgress =
                milestones.length > 0
                  ? milestones.reduce(
                      (value, milestone) =>
                        value +
                        milestone.progress,
                      0,
                    ) / milestones.length
                  : project.status ===
                      "COMPLETED"
                    ? 100
                    : 0;

              return sum + projectProgress;
            },
            0,
          ) / projects.length,
        )
      : 0;

  function money(value: number): string {
    return new Intl.NumberFormat(
      "ar-SA",
      {
        style: "currency",
        currency:
          context.workspace
            .defaultCurrency,
        maximumFractionDigits: 0,
      },
    ).format(value);
  }

  return (
    <main className={styles.page}>
      <WorkspaceHeader
        className={styles.header}
        eyebrow="محفظة الأعمال"
        title="المشاريع"
        description="متابعة الميزانيات والمشتريات والمنافسات والعقود والإنجاز من منظور المشروع."
        actions={
          canCreate ? (
            <Link
              className={styles.createButton}
              href="/platform/projects/new"
            >
              ＋ مشروع جديد
            </Link>
          ) : null
        }
      />

      <section
        className={styles.summary}
        aria-label="ملخص محفظة المشاريع"
      >
        <article>
          <span>إجمالي المشاريع</span>
          <strong>{projects.length}</strong>
          <small>
            {active} مشروع نشط
          </small>
        </article>

        <article>
          <span>
            الميزانيات المعتمدة
          </span>
          <strong>
            {money(totalBudget)}
          </strong>
          <small>إجمالي المحفظة</small>
        </article>

        <article>
          <span>
            الارتباطات التعاقدية
          </span>
          <strong>
            {money(committed)}
          </strong>
          <small>
            {totalBudget
              ? Math.round(
                  (committed /
                    totalBudget) *
                    100,
                )
              : 0}
            % من الميزانية
          </small>
        </article>

        <article>
          <span>متوسط الإنجاز</span>
          <strong>
            {averageProgress}%
          </strong>
          <small>
            وفق مراحل العقود
          </small>
        </article>
      </section>

      <FormSection
        className={`${styles.panel} ${styles.projectPanel}`}
        eyebrow="سجل المشاريع"
        title="المحفظة الحالية"
        description="المشاريع والميزانيات والعقود والمنافسات المرتبطة بمساحة العمل."
        actions={
          <small>
            {projects.length} مشروع
          </small>
        }
      >
        {projects.length > 0 ? (
          <div className={styles.cards}>
            {projects.map((project) => {
              const projectCommitted =
                project.contracts.reduce(
                  (sum, contract) =>
                    sum +
                    Number(
                      contract.totalAmount,
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
                        (
                          sum,
                          milestone,
                        ) =>
                          sum +
                          milestone.progress,
                        0,
                      ) /
                        milestones.length,
                    )
                  : project.status ===
                      "COMPLETED"
                    ? 100
                    : 0;

              const utilization =
                Number(project.budget)
                  ? Math.min(
                      100,
                      Math.round(
                        (projectCommitted /
                          Number(
                            project.budget,
                          )) *
                          100,
                      ),
                    )
                  : 0;

              return (
                <Link
                  href={`/platform/projects/${project.id}`}
                  key={project.id}
                >
                  <div
                    className={
                      styles.cardHead
                    }
                  >
                    <div>
                      <span>
                        {project.code}
                      </span>
                      <h3>
                        {project.nameAr}
                      </h3>
                    </div>

                    <b
                      data-status={
                        project.status
                      }
                    >
                      {
                        statusLabels[
                          project.status
                        ]
                      }
                    </b>
                  </div>

                  <div
                    className={
                      styles.metrics
                    }
                  >
                    <span>
                      الميزانية
                      <strong>
                        {project.budget
                          ? money(
                              Number(
                                project.budget,
                              ),
                            )
                          : "غير محددة"}
                      </strong>
                    </span>

                    <span>
                      المرتبط
                      <strong>
                        {money(
                          projectCommitted,
                        )}
                      </strong>
                    </span>

                    <span>
                      العقود
                      <strong>
                        {
                          project.contracts
                            .length
                        }
                      </strong>
                    </span>

                    <span>
                      المنافسات
                      <strong>
                        {
                          project
                            .opportunities
                            .length
                        }
                      </strong>
                    </span>
                  </div>

                  <div
                    className={
                      styles.progress
                    }
                  >
                    <div>
                      <span>
                        الإنجاز {progress}%
                      </span>
                      <span>
                        استخدام الميزانية{" "}
                        {utilization}%
                      </span>
                    </div>

                    <i aria-hidden="true">
                      <b
                        style={{
                          width:
                            `${progress}%`,
                        }}
                      />
                    </i>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <EmptyState
            className={styles.empty}
            tone="info"
            icon="▦"
            title="لا توجد مشاريع حتى الآن"
            description="أنشئ المشروع الأول لربط الميزانية والمشتريات والمنافسات والعقود به."
            actions={
              canCreate ? (
                <Link
                  className={
                    styles.createButton
                  }
                  href="/platform/projects/new"
                >
                  ＋ إنشاء أول مشروع
                </Link>
              ) : null
            }
            role="status"
          />
        )}
      </FormSection>
    </main>
  );
}
