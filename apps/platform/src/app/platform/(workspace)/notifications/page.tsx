import Link from "next/link";

import {
  EmptyState,
  FormActions,
  FormGuidance,
  FormSection,
  WorkspaceHeader,
} from "@oqood/design-system";

import {
  dismissNotificationAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
  updateNotificationPreferencesAction,
} from "@/features/notifications/actions";
import { getOperationalNotifications } from "@/features/notifications/operational-notifications";
import { requireAuthenticatedUser } from "@/features/workspace/guards";
import { prisma } from "@/lib/prisma";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

import styles from "./notifications.module.css";

const kindLabels = {
  document: "مستند",
  opportunity: "منافسة",
  contract: "عقد",
  milestone: "مرحلة تنفيذ",
  approval: "اعتماد",
};

export default async function NotificationsPage() {
  const [context, user] = await Promise.all([
    requireCurrentWorkspace(),
    requireAuthenticatedUser(),
  ]);
  const notifications = await getOperationalNotifications(context, user.id);
  const preferences = await prisma.notificationPreference.findMany({
    where: { workspaceId: context.workspace.id, userId: user.id },
  });
  const preferenceMap = new Map(preferences.map((item) => [item.category, item]));
  const unread = notifications.filter((item) => !item.read);
  const danger = notifications.filter((item) => item.severity === "danger");
  const warning = notifications.filter((item) => item.severity === "warning");

  return <main className={styles.page}>
    <WorkspaceHeader
      className={styles.header}
      eyebrow="متابعة استباقية موحّدة"
      title="مركز الإشعارات"
      description="التنبيهات الحرجة والمواعيد والقرارات المعلّقة عبر جميع أعمال المنصة."
      actions={
        unread.length > 0 ? (
          <form action={markAllNotificationsReadAction}>
            {unread.map((item) => (
              <input
                key={item.fingerprint}
                name="fingerprint"
                type="hidden"
                value={item.fingerprint}
              />
            ))}
            <button type="submit">
              تحديد الكل كمقروء
            </button>
          </form>
        ) : null
      }
    />

    <section className={styles.summary}>
      <article><span>غير مقروء</span><strong>{unread.length}</strong><small>من أصل {notifications.length} إشعار</small></article>
      <article data-tone={danger.length ? "danger" : "normal"}><span>حرج ومتأخر</span><strong>{danger.length}</strong><small>يحتاج إلى إجراء فوري</small></article>
      <article data-tone={warning.length ? "warning" : "normal"}><span>تنبيه مبكر</span><strong>{warning.length}</strong><small>خلال 7 إلى 30 يومًا</small></article>
      <article><span>قرارات معلّقة</span><strong>{notifications.filter((item) => item.kind === "approval").length}</strong><small><Link href="/platform/approvals">فتح مركز الموافقات</Link></small></article>
    </section>

    <FormSection
      className={`${styles.panel} ${styles.notificationsPanel}`}
      eyebrow="صندوق المتابعة"
      title="جميع الإشعارات النشطة"
      description="مرتبة حسب الأهمية والاستحقاق."
    >
      {notifications.length === 0 ? (
        <EmptyState
          className={styles.empty}
          tone="success"
          icon="✓"
          title="لا توجد إشعارات نشطة"
          description="جميع المواعيد والقرارات التشغيلية تحت السيطرة."
          role="status"
        />
      ) :
        <div className={styles.list}>{notifications.map((item) => <article data-read={item.read} data-severity={item.severity} key={item.fingerprint}>
          <span className={styles.kind}>{kindLabels[item.kind]}</span>
          <div className={styles.content}><strong>{item.title}</strong><p>{item.description}</p>{item.dueAt && <time dateTime={item.dueAt.toISOString()}>الاستحقاق: {new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium" }).format(item.dueAt)}</time>}</div>
          <Link className={styles.open} href={item.href}>فتح</Link>
          {!item.read && <form action={markNotificationReadAction}><input name="fingerprint" type="hidden" value={item.fingerprint} /><button type="submit">مقروء</button></form>}
          <form action={dismissNotificationAction}><input name="fingerprint" type="hidden" value={item.fingerprint} /><button data-dismiss type="submit">إخفاء</button></form>
        </article>)}</div>}
    </FormSection>
    <FormSection
      className={`${styles.panel} ${styles.preferencesPanel}`}
      eyebrow="قنوات التواصل"
      title="تفضيلات الإشعارات"
      description="يمكن تخصيص الإشعارات داخل المنصة والبريد لكل فئة."
    >
      <form
        action={updateNotificationPreferencesAction}
        className={styles.preferencesForm}
      >
        <FormGuidance
          className={styles.preferencesGuidance}
          icon="✦"
          title="خصص طريقة استلام الإشعارات"
          description="حدد لكل فئة ما إذا كنت تريد إشعارات داخل المنصة أو عبر البريد الإلكتروني."
        />

        <div className={styles.preferenceRows}>
          {[
            [
              "TEAM_INVITATIONS",
              "دعوات الفريق",
            ],
            [
              "OPPORTUNITIES",
              "المنافسات والمواعيد",
            ],
            [
              "CONTRACTS",
              "العقود ومراحل التنفيذ",
            ],
            [
              "APPROVALS",
              "الموافقات والقرارات",
            ],
          ].map(([category, label]) => {
            const preference =
              preferenceMap.get(category);

            return (
              <div
                className={styles.preferenceRow}
                key={category}
              >
                <strong>
                  {label}
                </strong>

                <label>
                  <input
                    defaultChecked={
                      preference
                        ?.inAppEnabled ?? true
                    }
                    name={`inApp:${category}`}
                    type="checkbox"
                  />
                  <span>
                    داخل المنصة
                  </span>
                </label>

                <label>
                  <input
                    defaultChecked={
                      preference
                        ?.emailEnabled ?? true
                    }
                    name={`email:${category}`}
                    type="checkbox"
                  />
                  <span>
                    البريد الإلكتروني
                  </span>
                </label>
              </div>
            );
          })}
        </div>

        <label
          className={styles.digestField}
          htmlFor="notification-digest"
        >
          <span>
            تجميع رسائل البريد
          </span>

          <select
            defaultValue={
              preferences[0]?.digest ??
              "IMMEDIATE"
            }
            id="notification-digest"
            name="digest"
          >
            <option value="IMMEDIATE">
              فوري
            </option>

            <option value="DAILY">
              ملخص يومي
            </option>

            <option value="WEEKLY">
              ملخص أسبوعي
            </option>
          </select>
        </label>

        <FormActions
          className={styles.preferenceActions}
          status="سيتم تطبيق التفضيلات على الإشعارات الجديدة."
        >
          <button
            className={styles.savePreferences}
            type="submit"
          >
            حفظ التفضيلات
          </button>
        </FormActions>
      </form>
    </FormSection>
  </main>;
}
