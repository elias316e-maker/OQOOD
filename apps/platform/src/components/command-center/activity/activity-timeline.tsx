import {
  Badge,
  DashboardPanel,
  EmptyState,
} from "@oqood/design-system";

import type {
  CommandActivity,
  CommandCenterActivityData,
} from "@/features/command-center";

import styles from "./activity-timeline.module.css";

type ActivityTimelineProps = {
  data: CommandCenterActivityData;
};

function ActivityItem({
  activity,
  last,
}: {
  activity: CommandActivity;
  last: boolean;
}) {
  return (
    <li
      aria-label={`${activity.title} بواسطة ${activity.actor}، ${activity.time}`}
      className={styles.item}
    >
      <div
        aria-hidden="true"
        className={
          styles.timelineColumn
        }
      >
        <span
          className={`${styles.icon} ${styles[`tone-${activity.tone}`]}`}
        >
          {activity.icon}
        </span>

        {!last ? (
          <span
            className={styles.line}
          />
        ) : null}
      </div>

      <div className={styles.content}>
        <strong>
          {activity.title}
        </strong>

        <p>
          {activity.description}
        </p>

        <div className={styles.meta}>
          <span>
            {activity.actor}
          </span>

          <small>
            {activity.time}
          </small>
        </div>
      </div>
    </li>
  );
}

export function ActivityTimeline({
  data,
}: ActivityTimelineProps) {
  return (
    <DashboardPanel
      action={
        <Badge
          className={styles.activityCount}
          size="sm"
          tone={
            data.items.length > 0
              ? "info"
              : "neutral"
          }
        >
          {data.items.length}
          {" تحديثات"}
        </Badge>
      }
      aria-label="آخر النشاطات"
      className={styles.panel}
      description="آخر التحديثات المسجلة داخل مساحة العمل."
      footer={
        data.items.length > 0 ? (
          <span
            className={styles.footerNote}
          >
            يعرض هذا القسم أحدث النشاطات
            المتاحة في سجل مساحة العمل.
          </span>
        ) : null
      }
      padding="none"
      title="آخر النشاطات"
    >
      {data.items.length > 0 ? (
        <ol
          aria-label="التسلسل الزمني للنشاطات"
          className={styles.list}
        >
          {data.items.map(
            (activity, index) => (
              <ActivityItem
                activity={activity}
                key={activity.id}
                last={
                  index ===
                  data.items.length - 1
                }
              />
            ),
          )}
        </ol>
      ) : (
        <EmptyState
          className={styles.empty}
          tone="success"
          icon="✓"
          title="لا توجد نشاطات حديثة"
          description="لا توجد تحديثات جديدة مسجلة داخل مساحة العمل."
          role="status"
        />
      )}
    </DashboardPanel>
  );
}
