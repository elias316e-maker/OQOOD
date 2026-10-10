import type {
  CSSProperties,
} from "react";

import Link from "next/link";

import {
  Badge,
  DashboardPanel,
  EmptyState,
} from "@oqood/design-system";

import type {
  CommandCenterNotificationsData,
  CommandCenterSummaryData,
  SmartNotification,
} from "@/features/command-center";

import styles from "./summary-notifications.module.css";

type SummaryNotificationsProps = {
  summary: CommandCenterSummaryData;
  notifications:
    CommandCenterNotificationsData;
};

type BadgeTone =
  | "neutral"
  | "info"
  | "primary"
  | "success"
  | "warning"
  | "danger";

const notificationTones: Record<
  SmartNotification["tone"],
  BadgeTone
> = {
  blue: "info",
  green: "success",
  orange: "warning",
  purple: "primary",
  red: "danger",
};

function NotificationItem({
  notification,
}: {
  notification: SmartNotification;
}) {
  return (
    <div
      aria-label={`${notification.title}${
        notification.unread
          ? "، غير مقروء"
          : ""
      }`}
      className={[
        styles.notification,
        styles[
          `tone-${notification.tone}`
        ],
        notification.unread
          ? styles.unread
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
      role="listitem"
    >
      <span
        aria-hidden="true"
        className={
          styles.notificationIcon
        }
      >
        {notification.icon}
      </span>

      <div
        className={
          styles.notificationContent
        }
      >
        <strong>
          {notification.title}
        </strong>

        <p>
          {notification.description}
        </p>
      </div>

      <div
        className={
          styles.notificationMeta
        }
      >
        {notification.unread ? (
          <Badge
            className={
              styles.unreadBadge
            }
            size="sm"
            tone={
              notificationTones[
                notification.tone
              ]
            }
          >
            غير مقروء
          </Badge>
        ) : null}

        <small>
          {notification.time}
        </small>
      </div>
    </div>
  );
}

export function SummaryNotifications({
  summary,
  notifications,
}: SummaryNotificationsProps) {
  const healthScore = Math.min(
    100,
    Math.max(
      0,
      summary.healthScore,
    ),
  );

  const healthTone:
    | "success"
    | "info"
    | "warning" =
    healthScore >= 80
      ? "success"
      : healthScore >= 60
        ? "info"
        : "warning";

  const healthLabel =
    healthScore >= 80
      ? "صحة الأعمال ممتازة"
      : healthScore >= 60
        ? "صحة الأعمال مستقرة"
        : "صحة الأعمال تحتاج متابعة";

  return (
    <section
      aria-label="النظرة التنفيذية والإشعارات الذكية"
      className={styles.layout}
    >
      <DashboardPanel
        action={
          <Badge
            className={
              styles.executiveBadge
            }
            size="sm"
            tone="primary"
          >
            Executive Overview
          </Badge>
        }
        aria-label="النظرة التنفيذية"
        className={
          styles.summaryPanel
        }
        description={
          summary.description
        }
        footer={
          <div
            className={
              styles.summaryFooter
            }
          >
            <div
              className={
                styles.healthStatus
              }
            >
              <span
                aria-hidden="true"
                className={`${styles.serviceDot} ${styles[`health-${healthTone}`]}`}
              />

              <span>
                {healthLabel}
              </span>
            </div>

            <Link
              className={
                styles.panelLink
              }
              href="/platform/reports"
            >
              فتح التقرير التنفيذي
            </Link>
          </div>
        }
        padding="none"
        title={summary.headline}
      >
        <div
          className={styles.summaryBody}
        >
          <div
            aria-label={`مؤشر صحة الأعمال: ${healthScore}%`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={
              healthScore
            }
            aria-valuetext={`${healthScore}% — ${healthLabel}`}
            className={
              styles.healthScore
            }
            role="progressbar"
            style={
              {
                "--health-angle":
                  `${healthScore * 3.6}deg`,
              } as CSSProperties
            }
          >
            <div>
              <strong>
                {healthScore}%
              </strong>

              <span>
                صحة الأعمال
              </span>
            </div>
          </div>

          {summary.items.length > 0 ? (
            <div
              aria-label="مؤشرات النظرة التنفيذية"
              className={
                styles.summaryGrid
              }
              role="list"
            >
              {summary.items.map(
                (item) => (
                  <div
                    aria-label={`${item.label}: ${item.value}`}
                    className={`${styles.summaryItem} ${styles[`tone-${item.tone}`]}`}
                    key={item.id}
                    role="listitem"
                  >
                    <span>
                      {item.label}
                    </span>

                    <strong>
                      {item.value}
                    </strong>
                  </div>
                ),
              )}
            </div>
          ) : (
            <EmptyState
              className={styles.empty}
              icon="▦"
              title="لا توجد مؤشرات تنفيذية"
              description="ستظهر المؤشرات التنفيذية بعد إضافة البيانات التشغيلية إلى مساحة العمل."
              role="status"
            />
          )}
        </div>
      </DashboardPanel>

      <DashboardPanel
        action={
          <Badge
            className={
              styles.notificationCount
            }
            size="sm"
            tone={
              notifications.unreadCount >
              0
                ? "warning"
                : "success"
            }
          >
            {
              notifications.unreadCount
            }
            {" غير مقروء"}
          </Badge>
        }
        aria-label="الإشعارات الذكية"
        className={
          styles.notificationsPanel
        }
        description="أهم التنبيهات التي تحتاج إلى الانتباه."
        footer={
          <Link
            className={`${styles.panelLink} ${styles.viewAll}`}
            href="/platform/notifications"
          >
            عرض جميع الإشعارات
          </Link>
        }
        padding="none"
        title="الإشعارات الذكية"
      >
        {notifications.items.length >
        0 ? (
          <div
            className={
              styles.notificationsList
            }
            role="list"
          >
            {notifications.items.map(
              (notification) => (
                <NotificationItem
                  key={
                    notification.id
                  }
                  notification={
                    notification
                  }
                />
              ),
            )}
          </div>
        ) : (
          <EmptyState
            className={styles.empty}
            tone="success"
            icon="✓"
            title="لا توجد إشعارات جديدة"
            description="لا توجد تنبيهات تشغيلية تحتاج إلى متابعتك حاليًا."
            role="status"
          />
        )}
      </DashboardPanel>
    </section>
  );
}
