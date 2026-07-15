import Link from "next/link";
import type {
  CommandEvent,
  CommandOpportunity,
} from "@/features/command-center";
import styles from "./opportunities-calendar.module.css";

type OpportunitiesCalendarProps = {
  opportunities: CommandOpportunity[];
  events: CommandEvent[];
};

const statusLabels = {
  draft: "مسودة",
  published: "منشورة",
  evaluation: "قيد التقييم",
  closing: "تغلق قريبًا",
} as const;

export function OpportunitiesCalendar({
  opportunities,
  events,
}: OpportunitiesCalendarProps) {
  return (
    <section className={styles.layout}>
      <article className={styles.panel}>
        <header className={styles.header}>
          <div>
            <h2>أحدث الفرص والمنافسات</h2>
            <p>آخر العناصر التي يعمل عليها فريقك.</p>
          </div>

          <Link href="/platform/opportunities">عرض الكل</Link>
        </header>

        <div className={styles.list}>
          {opportunities.map((opportunity) => (
            <Link
              className={styles.opportunity}
              href={`/platform/opportunities/${opportunity.id}`}
              key={opportunity.id}
            >
              <span className={styles.mark}>
                {opportunity.reference.slice(0, 2)}
              </span>

              <div>
                <strong>{opportunity.title}</strong>
                <small>
                  {opportunity.reference} · {opportunity.organization}
                </small>
              </div>

              <span>{opportunity.value}</span>

              <span
                className={`${styles.status} ${
                  styles[`status-${opportunity.status}`]
                }`}
              >
                {statusLabels[opportunity.status]}
              </span>
            </Link>
          ))}
        </div>
      </article>

      <article className={styles.panel}>
        <header className={styles.header}>
          <div>
            <h2>المواعيد القادمة</h2>
            <p>أهم المواعيد خلال الأيام المقبلة.</p>
          </div>

          <Link href="/platform/calendar">التقويم</Link>
        </header>

        <div className={styles.list}>
          {events.map((event) => (
            <article className={styles.event} key={event.id}>
              <div className={styles.date}>
                <strong>{event.day}</strong>
                <small>{event.month}</small>
              </div>

              <div>
                <strong>{event.title}</strong>
                <small>{event.description}</small>
              </div>

              <span>{event.time}</span>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}
