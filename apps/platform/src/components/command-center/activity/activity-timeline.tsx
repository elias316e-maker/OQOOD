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
    <article className={styles.item}>
      <div className={styles.timelineColumn}>
        <span
          className={`${styles.icon} ${
            styles[`tone-${activity.tone}`]
          }`}
        >
          {activity.icon}
        </span>

        {!last ? <i className={styles.line} /> : null}
      </div>

      <div className={styles.content}>
        <strong>{activity.title}</strong>
        <p>{activity.description}</p>

        <footer>
          <span>{activity.actor}</span>
          <small>{activity.time}</small>
        </footer>
      </div>
    </article>
  );
}

export function ActivityTimeline({
  data,
}: ActivityTimelineProps) {
  return (
    <section className={styles.panel}>
      <header>
        <div>
          <h2>آخر النشاطات</h2>
          <p>آخر التحديثات داخل مساحة العمل.</p>
        </div>

        <button type="button">عرض السجل</button>
      </header>

      <div className={styles.list}>
        {data.items.map((activity, index) => (
          <ActivityItem
            activity={activity}
            key={activity.id}
            last={index === data.items.length - 1}
          />
        ))}
      </div>

      <button className={styles.loadMore} type="button">
        تحميل المزيد
      </button>
    </section>
  );
}
