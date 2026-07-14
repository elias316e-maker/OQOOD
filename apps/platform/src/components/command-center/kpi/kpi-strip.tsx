import type { CommandCenterKpi } from "@/features/command-center";
import styles from "./kpi-strip.module.css";

type KpiStripProps = {
  items: CommandCenterKpi[];
};

function Sparkline({ values }: { values: number[] }) {
  const maximum = Math.max(...values);
  const minimum = Math.min(...values);
  const range = maximum - minimum || 1;

  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 34 - ((value - minimum) / range) * 28;

      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      aria-hidden="true"
      className={styles.sparkline}
      viewBox="0 0 100 38"
    >
      <polyline points={points} />
    </svg>
  );
}

export function KpiStrip({ items }: KpiStripProps) {
  return (
    <section className={styles.grid}>
      {items.map((item) => (
        <article
          className={`${styles.card} ${styles[`tone-${item.tone}`]}`}
          key={item.id}
        >
          <header>
            <span>{item.title}</span>
            <span className={styles.icon}>{item.icon}</span>
          </header>

          <div className={styles.main}>
            <div>
              <strong>{item.value}</strong>
              {item.unit ? <small>{item.unit}</small> : null}
            </div>

            <Sparkline values={item.chart} />
          </div>

          <footer
            className={
              item.trend === "up"
                ? styles.trendUp
                : styles.trendDown
            }
          >
            <span>{item.trend === "up" ? "↑" : "↓"}</span>
            {item.change}
          </footer>
        </article>
      ))}
    </section>
  );
}
