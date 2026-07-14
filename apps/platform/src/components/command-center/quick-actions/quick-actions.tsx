import Link from "next/link";
import type {
  CommandCenterActionsData,
  QuickAction,
} from "@/features/command-center";
import styles from "./quick-actions.module.css";

type QuickActionsProps = {
  data: CommandCenterActionsData;
};

function ActionTile({ action }: { action: QuickAction }) {
  return (
    <Link
      className={`${styles.action} ${
        styles[`tone-${action.tone}`]
      }`}
      href={action.href}
    >
      <span className={styles.icon} aria-hidden="true">
        {action.icon}
      </span>

      <strong>{action.title}</strong>
      <small>{action.description}</small>

      <span className={styles.arrow} aria-hidden="true">
        ←
      </span>
    </Link>
  );
}

export function QuickActions({ data }: QuickActionsProps) {
  return (
    <section className={styles.panel}>
      <header>
        <div>
          <h2>إجراءات سريعة</h2>
          <p>ابدأ أكثر العمليات استخدامًا مباشرة.</p>
        </div>

        <button type="button">تخصيص</button>
      </header>

      <div className={styles.grid}>
        {data.actions.map((action) => (
          <ActionTile action={action} key={action.id} />
        ))}
      </div>
    </section>
  );
}
