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

import styles from "./calendar.module.css";

type CalendarEvent = {
  id: string;
  date: Date;
  kind:
    | "opportunity"
    | "procurement"
    | "contract"
    | "milestone";
  title: string;
  detail: string;
  href: string;
};

type EventGroupTone =
  | "danger"
  | "current"
  | "normal";

type EventGroupProps = {
  title: string;
  eyebrow: string;
  tone: EventGroupTone;
  events: CalendarEvent[];
  emptyDescription: string;
};

const kindLabels: Record<
  CalendarEvent["kind"],
  string
> = {
  opportunity: "إغلاق منافسة",
  procurement: "احتياج مشتريات",
  contract: "انتهاء عقد",
  milestone: "استحقاق مرحلة",
};

export default async function CalendarPage() {
  const context =
    await requireCurrentWorkspace();

  const workspaceId =
    context.workspace.id;

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

  const [
    procurement,
    opportunities,
    contracts,
    milestones,
  ] = await Promise.all([
    canReadProcurement
      ? prisma.procurementRequest.findMany({
          where: {
            workspaceId,
            requiredByDate: {
              not: null,
            },
            status: {
              notIn: [
                "CANCELLED",
                "ARCHIVED",
                "REJECTED",
              ],
            },
          },
          select: {
            id: true,
            number: true,
            title: true,
            requiredByDate: true,
          },
        })
      : Promise.resolve([]),

    canReadOpportunities
      ? prisma.opportunity.findMany({
          where: {
            workspaceId,
            closingDate: {
              not: null,
            },
            status: {
              notIn: [
                "CANCELLED",
                "CLOSED",
                "ARCHIVED",
              ],
            },
          },
          select: {
            id: true,
            number: true,
            title: true,
            closingDate: true,
          },
        })
      : Promise.resolve([]),

    canReadContracts
      ? prisma.contract.findMany({
          where: {
            workspaceId,
            endDate: {
              not: null,
            },
            status: {
              in: [
                "ACTIVE",
                "SUSPENDED",
              ],
            },
          },
          select: {
            id: true,
            number: true,
            title: true,
            endDate: true,
          },
        })
      : Promise.resolve([]),

    canReadContracts
      ? prisma.contractMilestone.findMany({
          where: {
            contract: {
              workspaceId,
            },
            dueDate: {
              not: null,
            },
            status: {
              not: "ACCEPTED",
            },
          },
          select: {
            id: true,
            title: true,
            dueDate: true,
            contract: {
              select: {
                id: true,
                number: true,
              },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  const events: CalendarEvent[] = [
    ...procurement.map(
      (item) => ({
        id: item.id,
        date: item.requiredByDate!,
        kind: "procurement" as const,
        title: item.title,
        detail: item.number,
        href:
          `/platform/procurement/${item.id}`,
      }),
    ),

    ...opportunities.map(
      (item) => ({
        id: item.id,
        date: item.closingDate!,
        kind: "opportunity" as const,
        title: item.title,
        detail: item.number,
        href:
          `/platform/opportunities/${item.id}`,
      }),
    ),

    ...contracts.map(
      (item) => ({
        id: item.id,
        date: item.endDate!,
        kind: "contract" as const,
        title: item.title,
        detail: item.number,
        href:
          `/platform/contracts/${item.id}`,
      }),
    ),

    ...milestones.map(
      (item) => ({
        id: item.id,
        date: item.dueDate!,
        kind: "milestone" as const,
        title: item.title,
        detail: item.contract.number,
        href:
          `/platform/contracts/${item.contract.id}#execution`,
      }),
    ),
  ].sort(
    (a, b) =>
      a.date.getTime() -
      b.date.getTime(),
  );

  const now = new Date();

  const weekEnd = new Date(
    now.getTime() +
      7 * 86_400_000,
  );

  const monthEnd = new Date(
    now.getTime() +
      30 * 86_400_000,
  );

  const overdue = events.filter(
    (event) =>
      event.date < now,
  );

  const thisWeek = events.filter(
    (event) =>
      event.date >= now &&
      event.date <= weekEnd,
  );

  const thisMonth = events.filter(
    (event) =>
      event.date > weekEnd &&
      event.date <= monthEnd,
  );

  const later = events.filter(
    (event) =>
      event.date > monthEnd,
  );

  return (
    <main className={styles.page}>
      <WorkspaceHeader
        className={styles.header}
        eyebrow="المواعيد التشغيلية"
        title="التقويم والمهام"
        description="مواعيد المنافسات والمشتريات والعقود والتسليمات في مكان واحد."
        actions={
          <Link
            className={
              styles.alertsButton
            }
            href="/platform/contracts/alerts"
          >
            مركز التنبيهات
          </Link>
        }
      />

      <section
        aria-label="ملخص المواعيد التشغيلية"
        className={styles.summary}
      >
        <article
          data-tone={
            overdue.length > 0
              ? "danger"
              : "normal"
          }
        >
          <span>متأخرة</span>
          <strong>
            {overdue.length}
          </strong>
          <small>
            تحتاج إجراءً فوريًا
          </small>
        </article>

        <article>
          <span>خلال 7 أيام</span>
          <strong>
            {thisWeek.length}
          </strong>
          <small>
            مهام هذا الأسبوع
          </small>
        </article>

        <article>
          <span>خلال 30 يومًا</span>
          <strong>
            {thisMonth.length}
          </strong>
          <small>
            بعد الأسبوع الحالي
          </small>
        </article>

        <article>
          <span>لاحقًا</span>
          <strong>
            {later.length}
          </strong>
          <small>
            مواعيد مستقبلية
          </small>
        </article>
      </section>

      <div
        className={styles.columns}
        role="region"
        aria-label="مجموعات المواعيد"
      >
        <EventGroup
          emptyDescription="لا توجد مواعيد متأخرة تحتاج إلى معالجة."
          events={overdue}
          eyebrow="تجاوزت موعدها"
          title="متأخرة"
          tone="danger"
        />

        <EventGroup
          emptyDescription="لا توجد مواعيد مستحقة خلال الأيام السبعة القادمة."
          events={thisWeek}
          eyebrow="الأيام السبعة القادمة"
          title="هذا الأسبوع"
          tone="current"
        />

        <EventGroup
          emptyDescription="لا توجد مواعيد أخرى مستحقة خلال الثلاثين يومًا القادمة."
          events={thisMonth}
          eyebrow="بعد الأسبوع الحالي"
          title="هذا الشهر"
          tone="normal"
        />

        <EventGroup
          emptyDescription="لا توجد مواعيد مستقبلية بعد فترة الثلاثين يومًا."
          events={later}
          eyebrow="المدى البعيد"
          title="لاحقًا"
          tone="normal"
        />
      </div>
    </main>
  );
}

function EventGroup({
  title,
  eyebrow,
  tone,
  events,
  emptyDescription,
}: EventGroupProps) {
  return (
    <FormSection
      className={`${styles.group} ${styles.calendarGroup}`}
      data-tone={tone}
      eyebrow={eyebrow}
      title={title}
      actions={
        <span
          className={
            styles.groupCount
          }
        >
          {events.length}
        </span>
      }
    >
      {events.length === 0 ? (
        <EmptyState
          className={styles.empty}
          tone={
            tone === "danger"
              ? "success"
              : "info"
          }
          icon={
            tone === "danger"
              ? "✓"
              : "⌁"
          }
          title={
            tone === "danger"
              ? "لا توجد مواعيد متأخرة"
              : "لا توجد مواعيد"
          }
          description={
            emptyDescription
          }
          role="status"
        />
      ) : (
        <div className={styles.events}>
          {events.map((event) => (
            <Link
              href={event.href}
              key={`${event.kind}-${event.id}`}
            >
              <time
                dateTime={
                  event.date.toISOString()
                }
              >
                <strong>
                  {new Intl.DateTimeFormat(
                    "ar-SA",
                    {
                      day: "numeric",
                    },
                  ).format(event.date)}
                </strong>

                <span>
                  {new Intl.DateTimeFormat(
                    "ar-SA",
                    {
                      month: "short",
                    },
                  ).format(event.date)}
                </span>
              </time>

              <div
                className={
                  styles.eventInfo
                }
              >
                <small>
                  {
                    kindLabels[
                      event.kind
                    ]
                  }
                </small>

                <strong>
                  {event.title}
                </strong>

                <span>
                  {event.detail}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </FormSection>
  );
}
