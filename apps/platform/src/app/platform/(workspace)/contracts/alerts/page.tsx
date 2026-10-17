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

import styles from "../contracts.module.css";

type ContractAlertRow = {
  tone: "danger" | "warning";
  title: string;
  detail: string;
};

type ContractAlert = ContractAlertRow & {
  id: string;
  contractId: string;
};

export default async function ContractAlertsPage() {
  const context =
    await requireCurrentWorkspace();

  if (
    !hasPermission(
      context,
      Permissions.contracts.read,
    )
  ) {
    return (
      <main className={styles.page}>
        <EmptyState
          className={styles.panel}
          tone="warning"
          icon="!"
          title="لا تملك صلاحية عرض تنبيهات العقود"
          description="تواصل مع مسؤول مساحة العمل للحصول على صلاحية الاطلاع على العقود وتنبيهاتها."
          role="alert"
          aria-live="polite"
          actions={
            <Link
              className={styles.back}
              href="/platform/contracts"
            >
              العودة إلى العقود
            </Link>
          }
        />
      </main>
    );
  }

  const now = new Date();

  const warningDate = new Date(
    now.getTime() + 30 * 86_400_000,
  );

  const contracts =
    await prisma.contract.findMany({
      where: {
        workspaceId: context.workspace.id,
      },
      include: {
        milestones: true,
        amendments: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

  const alerts: ContractAlert[] =
    contracts.flatMap((contract) => {
      const rows: ContractAlertRow[] = [];

      if (
        contract.status ===
        "PENDING_APPROVAL"
      ) {
        rows.push({
          tone: "warning",
          title: "عقد ينتظر الاعتماد",
          detail: contract.title,
        });
      }

      if (
        contract.endDate &&
        contract.endDate <= warningDate
      ) {
        rows.push({
          tone:
            contract.endDate < now
              ? "danger"
              : "warning",
          title:
            contract.endDate < now
              ? "عقد متجاوز لتاريخ الانتهاء"
              : "عقد قريب من الانتهاء",
          detail:
            `${contract.title} — ${
              new Intl.DateTimeFormat(
                "ar-SA",
              ).format(contract.endDate)
            }`,
        });
      }

      contract.milestones.forEach(
        (milestone) => {
          if (
            milestone.dueDate &&
            milestone.dueDate < now &&
            milestone.status !==
              "ACCEPTED"
          ) {
            rows.push({
              tone: "danger",
              title:
                "مرحلة تنفيذ متأخرة",
              detail:
                `${contract.title}: ${milestone.title}`,
            });
          }

          if (
            milestone.paymentStatus ===
            "CLAIMED"
          ) {
            rows.push({
              tone: "warning",
              title:
                "مطالبة مالية غير مسددة",
              detail:
                `${contract.title}: ${milestone.title}`,
            });
          }
        },
      );

      contract.amendments
        .filter(
          (amendment) =>
            amendment.status ===
            "PENDING_APPROVAL",
        )
        .forEach((amendment) => {
          rows.push({
            tone: "warning",
            title:
              "ملحق ينتظر الاعتماد",
            detail:
              `${contract.title}: ملحق رقم ${amendment.number}`,
          });
        });

      return rows.map(
        (row, index) => ({
          ...row,
          id: `${contract.id}-${index}`,
          contractId: contract.id,
        }),
      );
    });

  const dangerCount = alerts.filter(
    (alert) =>
      alert.tone === "danger",
  ).length;

  const warningCount =
    alerts.length - dangerCount;

  const affectedContracts =
    new Set(
      alerts.map(
        (alert) => alert.contractId,
      ),
    ).size;

  return (
    <main className={styles.page}>
      <WorkspaceHeader
        className={styles.header}
        eyebrow="المتابعة الاستباقية"
        title="مركز تنبيهات العقود"
        description="المواعيد والمهام والمطالبات التي تتطلب متابعة أو تدخلاً."
        actions={
          <Link
            className={styles.back}
            href="/platform/contracts"
          >
            العودة إلى العقود
          </Link>
        }
      />

      <section
        className={styles.alertSummary}
        aria-label="ملخص تنبيهات العقود"
      >
        <article
          data-tone={
            dangerCount
              ? "danger"
              : "normal"
          }
        >
          <span>عاجلة</span>
          <strong>{dangerCount}</strong>
          <small>
            تحتاج تدخلاً مباشرًا
          </small>
        </article>

        <article>
          <span>تحذيرات</span>
          <strong>{warningCount}</strong>
          <small>تحتاج متابعة</small>
        </article>

        <article>
          <span>عقود متأثرة</span>
          <strong>
            {affectedContracts}
          </strong>
          <small>
            من أصل {contracts.length} عقد
          </small>
        </article>
      </section>

      <FormSection
        className={styles.panel}
        eyebrow="المتابعة التشغيلية"
        title="التنبيهات الحالية"
        description="العقود والمراحل والمطالبات والملاحق التي تحتاج إلى إجراء."
        actions={
          <strong>
            {alerts.length} تنبيه
          </strong>
        }
      >
        {alerts.length === 0 ? (
          <EmptyState
            className={styles.empty}
            tone="success"
            icon="✓"
            title="لا توجد تنبيهات حاليًا"
            description="لا توجد عقود أو مراحل أو مطالبات تستدعي التدخل في الوقت الحالي."
            role="status"
          />
        ) : (
          <div
            className={styles.alertList}
            aria-label="قائمة تنبيهات العقود"
          >
            {alerts.map((alert) => (
              <Link
                data-tone={alert.tone}
                href={`/platform/contracts/${alert.contractId}`}
                key={alert.id}
              >
                <strong>
                  {alert.title}
                </strong>

                <span>
                  {alert.detail}
                </span>
              </Link>
            ))}
          </div>
        )}
      </FormSection>
    </main>
  );
}
