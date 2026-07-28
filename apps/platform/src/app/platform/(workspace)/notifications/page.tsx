import Link from "next/link";

import {
  dismissNotificationAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/features/notifications/actions";
import { getOperationalNotifications } from "@/features/notifications/operational-notifications";
import { requireAuthenticatedUser } from "@/features/workspace/guards";
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
  const unread = notifications.filter((item) => !item.read);
  const danger = notifications.filter((item) => item.severity === "danger");
  const warning = notifications.filter((item) => item.severity === "warning");

  return <main className={styles.page}>
    <header className={styles.header}>
      <div><span>متابعة استباقية موحّدة</span><h1>مركز الإشعارات</h1><p>التنبيهات الحرجة والمواعيد والقرارات المعلّقة عبر جميع أعمال المنصة.</p></div>
      {unread.length > 0 && <form action={markAllNotificationsReadAction}>
        {unread.map((item) => <input key={item.fingerprint} name="fingerprint" type="hidden" value={item.fingerprint} />)}
        <button type="submit">تحديد الكل كمقروء</button>
      </form>}
    </header>

    <section className={styles.summary}>
      <article><span>غير مقروء</span><strong>{unread.length}</strong><small>من أصل {notifications.length} إشعار</small></article>
      <article data-tone={danger.length ? "danger" : "normal"}><span>حرج ومتأخر</span><strong>{danger.length}</strong><small>يحتاج إلى إجراء فوري</small></article>
      <article data-tone={warning.length ? "warning" : "normal"}><span>تنبيه مبكر</span><strong>{warning.length}</strong><small>خلال 7 إلى 30 يومًا</small></article>
      <article><span>قرارات معلّقة</span><strong>{notifications.filter((item) => item.kind === "approval").length}</strong><small><Link href="/platform/approvals">فتح مركز الموافقات</Link></small></article>
    </section>

    <section className={styles.panel}>
      <div className={styles.panelHead}><div><span>صندوق المتابعة</span><h2>جميع الإشعارات النشطة</h2></div><small>مرتبة حسب الأهمية والاستحقاق</small></div>
      {notifications.length === 0 ? <div className={styles.empty}><strong>لا توجد إشعارات نشطة</strong><p>جميع المواعيد والقرارات التشغيلية تحت السيطرة.</p></div> :
        <div className={styles.list}>{notifications.map((item) => <article data-read={item.read} data-severity={item.severity} key={item.fingerprint}>
          <span className={styles.kind}>{kindLabels[item.kind]}</span>
          <div className={styles.content}><strong>{item.title}</strong><p>{item.description}</p>{item.dueAt && <time dateTime={item.dueAt.toISOString()}>الاستحقاق: {new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium" }).format(item.dueAt)}</time>}</div>
          <Link className={styles.open} href={item.href}>فتح</Link>
          {!item.read && <form action={markNotificationReadAction}><input name="fingerprint" type="hidden" value={item.fingerprint} /><button type="submit">مقروء</button></form>}
          <form action={dismissNotificationAction}><input name="fingerprint" type="hidden" value={item.fingerprint} /><button data-dismiss type="submit">إخفاء</button></form>
        </article>)}</div>}
    </section>
  </main>;
}
