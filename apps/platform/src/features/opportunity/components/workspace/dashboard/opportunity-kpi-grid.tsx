import styles from "./opportunity-kpi-grid.module.css";

type OpportunityKpiTone =
  | "purple"
  | "blue"
  | "green"
  | "amber"
  | "rose"
  | "neutral";

export type OpportunityKpiItem = {
  label: string;
  value: string;
  helper?: string;
  icon?: string;
  tone?: OpportunityKpiTone;
};

type OpportunityKpiGridProps = {
  items: readonly OpportunityKpiItem[];
};

export function OpportunityKpiGrid({
  items,
}: OpportunityKpiGridProps) {
  return (
    <section
      className={styles.grid}
      aria-label="مؤشرات المنافسة"
    >
      {items.map((item) => (
        <article
          className={styles.card}
          data-tone={item.tone ?? "neutral"}
          key={item.label}
        >
          <div className={styles.top}>
            <span className={styles.icon} aria-hidden="true">
              {item.icon ?? "◇"}
            </span>

            <span className={styles.label}>
              {item.label}
            </span>
          </div>

          <strong className={styles.value}>
            {item.value}
          </strong>

          {item.helper && (
            <small className={styles.helper}>
              {item.helper}
            </small>
          )}
        </article>
      ))}
    </section>
  );
}
