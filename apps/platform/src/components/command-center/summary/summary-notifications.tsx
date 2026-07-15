import type {
  CommandCenterNotificationsData,
  CommandCenterSummaryData,
  SmartNotification,
} from "@/features/command-center";
import styles from "./summary-notifications.module.css";

type SummaryNotificationsProps = {
  summary: CommandCenterSummaryData;
  notifications: CommandCenterNotificationsData;
};

function NotificationItem({
  notification,
}: {
  notification: SmartNotification;
}) {
  return (
    <article
      className={[
        styles.notification,
        styles[`tone-${notification.tone}`],
        notification.unread ? styles.unread : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className={styles.notificationIcon} aria-hidden="true">
        {notification.icon}
      </span>

      <div className={styles.notificationContent}>
        <strong>{notification.title}</strong>
        <p>{notification.description}</p>
        <small>{notification.time}</small>
      </div>

      {notification.unread ? (
        <span className={styles.unreadDot} aria-label="غير مقروء" />
      ) : null}
    </article>
  );
}

export function SummaryNotifications({
  summary,
  notifications,
}: SummaryNotificationsProps) {
  return (
    <section className={styles.layout}>
      <article className={styles.summaryPanel}>
        <div className={styles.summaryGlow} />

        <header>
          <div>
            <span className={styles.eyebrow}>Executive Overview</span>
            <h2>{summary.headline}</h2>
            <p>{summary.description}</p>
          </div>

          <div
            className={styles.healthScore}
            style={
              {
                "--health-angle": `${summary.healthScore * 3.6}deg`,
              } as React.CSSProperties
            }
          >
            <div>
              <strong>{summary.healthScore}%</strong>
              <span>صحة الأعمال</span>
            </div>
          </div>
        </header>

        <div className={styles.summaryGrid}>
          {summary.items.map((item) => (
            <article
              className={`${styles.summaryItem} ${
                styles[`tone-${item.tone}`]
              }`}
              key={item.id}
            >
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </article>
          ))}
        </div>

        <footer>
          <span>
            <i />
            جميع الخدمات الأساسية تعمل بصورة طبيعية.
          </span>

          <button type="button">فتح التقرير التنفيذي</button>
        </footer>
      </article>

      <article className={styles.notificationsPanel}>
        <header className={styles.notificationsHeader}>
          <div>
            <h2>الإشعارات الذكية</h2>
            <p>أهم التنبيهات التي تحتاج إلى الانتباه.</p>
          </div>

          <span className={styles.notificationCount}>
            {notifications.unreadCount}
          </span>
        </header>

        <div className={styles.notificationsList}>
          {notifications.items.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
            />
          ))}
        </div>

        <button className={styles.viewAll} type="button">
          عرض جميع الإشعارات
        </button>
      </article>
    </section>
  );
}
