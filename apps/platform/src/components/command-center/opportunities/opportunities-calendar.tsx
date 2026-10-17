import Link from "next/link";

import {
  Badge,
  DashboardPanel,
  EmptyState,
} from "@oqood/design-system";

import type {
  CommandEvent,
  CommandOpportunity,
} from "@/features/command-center";

import styles from "./opportunities-calendar.module.css";

type OpportunitiesCalendarProps = {
  opportunities: CommandOpportunity[];
  events: CommandEvent[];
};

type BadgeTone =
  | "neutral"
  | "info"
  | "primary"
  | "success"
  | "warning"
  | "danger";

const statusLabels: Record<
  CommandOpportunity["status"],
  string
> = {
  draft: "مسودة",
  published: "منشورة",
  evaluation: "قيد التقييم",
  closing: "تغلق قريبًا",
};

const statusTones: Record<
  CommandOpportunity["status"],
  BadgeTone
> = {
  draft: "neutral",
  published: "success",
  evaluation: "primary",
  closing: "danger",
};

const eventTones: Record<
  CommandEvent["tone"],
  BadgeTone
> = {
  blue: "info",
  green: "success",
  orange: "warning",
  purple: "primary",
  red: "danger",
};

function OpportunityItem({
  opportunity,
}: {
  opportunity: CommandOpportunity;
}) {
  const progress = Math.min(
    100,
    Math.max(
      0,
      opportunity.progress,
    ),
  );

  const mark =
    opportunity.reference
      .trim()
      .slice(0, 2)
      .toUpperCase() || "—";

  return (
    <li className={styles.listItem}>
      <Link
        aria-label={`فتح المنافسة ${opportunity.title}`}
        className={styles.opportunity}
        href={`/platform/opportunities/${opportunity.id}`}
      >
        <span
          aria-hidden="true"
          className={styles.mark}
        >
          {mark}
        </span>

        <div
          className={
            styles.opportunityContent
          }
        >
          <div
            className={
              styles.opportunityHeading
            }
          >
            <strong>
              {opportunity.title}
            </strong>

            <Badge
              className={
                styles.statusBadge
              }
              size="sm"
              tone={
                statusTones[
                  opportunity.status
                ]
              }
            >
              {
                statusLabels[
                  opportunity.status
                ]
              }
            </Badge>
          </div>

          <small>
            {opportunity.reference}
            {" · "}
            {opportunity.organization}
          </small>

          <div
            className={
              styles.progressRow
            }
          >
            <div
              aria-label={`تقدم المنافسة ${progress}%`}
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={progress}
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
                  width: `${progress}%`,
                }}
              />
            </div>

            <span>
              {progress}%
            </span>
          </div>
        </div>

        <div
          className={
            styles.opportunityMeta
          }
        >
          <strong>
            {opportunity.value}
          </strong>

          <small>
            {opportunity.closingLabel}
          </small>
        </div>

        <span
          aria-hidden="true"
          className={styles.arrow}
        >
          ←
        </span>
      </Link>
    </li>
  );
}

function EventItem({
  event,
}: {
  event: CommandEvent;
}) {
  return (
    <li
      aria-label={`${event.title}، ${event.day} ${event.month}، ${event.time}`}
      className={`${styles.event} ${styles[`tone-${event.tone}`]}`}
    >
      <div className={styles.date}>
        <strong>{event.day}</strong>

        <small>{event.month}</small>
      </div>

      <div
        className={styles.eventContent}
      >
        <strong>
          {event.title}
        </strong>

        <small>
          {event.description}
        </small>
      </div>

      <Badge
        className={styles.eventTime}
        size="sm"
        tone={eventTones[event.tone]}
      >
        {event.time}
      </Badge>
    </li>
  );
}

export function OpportunitiesCalendar({
  opportunities,
  events,
}: OpportunitiesCalendarProps) {
  return (
    <section
      aria-label="المنافسات والمواعيد القادمة"
      className={styles.layout}
    >
      <DashboardPanel
        action={
          <div
            className={
              styles.headerActions
            }
          >
            <Badge
              size="sm"
              tone="info"
            >
              {opportunities.length}
              {" منافسات"}
            </Badge>

            <Link
              className={styles.panelLink}
              href="/platform/opportunities"
            >
              عرض الكل
            </Link>
          </div>
        }
        aria-label="أحدث الفرص والمنافسات"
        className={styles.panel}
        description="آخر المنافسات التي يعمل عليها فريقك ونسبة تقدم كل منها."
        padding="none"
        title="أحدث الفرص والمنافسات"
      >
        {opportunities.length > 0 ? (
          <ul className={styles.list}>
            {opportunities.map(
              (opportunity) => (
                <OpportunityItem
                  key={opportunity.id}
                  opportunity={
                    opportunity
                  }
                />
              ),
            )}
          </ul>
        ) : (
          <EmptyState
            className={styles.empty}
            icon="◇"
            title="لا توجد منافسات حالية"
            description="ستظهر أحدث الفرص والمنافسات هنا بعد إنشاء أول منافسة."
            role="status"
          />
        )}
      </DashboardPanel>

      <DashboardPanel
        action={
          <div
            className={
              styles.headerActions
            }
          >
            <Badge
              size="sm"
              tone={
                events.length > 0
                  ? "warning"
                  : "neutral"
              }
            >
              {events.length}
              {" مواعيد"}
            </Badge>

            <Link
              className={styles.panelLink}
              href="/platform/calendar"
            >
              التقويم
            </Link>
          </div>
        }
        aria-label="المواعيد القادمة"
        className={styles.panel}
        description="أهم مواعيد الإغلاق وانتهاء العقود خلال الأيام المقبلة."
        padding="none"
        title="المواعيد القادمة"
      >
        {events.length > 0 ? (
          <ul className={styles.list}>
            {events.map((event) => (
              <EventItem
                event={event}
                key={event.id}
              />
            ))}
          </ul>
        ) : (
          <EmptyState
            className={styles.empty}
            tone="success"
            icon="✓"
            title="لا توجد مواعيد عاجلة"
            description="لا توجد مواعيد إغلاق أو انتهاء قريبة تحتاج إلى متابعة."
            role="status"
          />
        )}
      </DashboardPanel>
    </section>
  );
}
