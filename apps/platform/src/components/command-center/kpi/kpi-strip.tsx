import {
  Badge,
  DashboardPanel,
} from "@oqood/design-system";

import type {
  CommandCenterKpi,
} from "@/features/command-center";

import styles from "./kpi-strip.module.css";

type KpiStripProps = {
  items: CommandCenterKpi[];
};

type SparklineProps = {
  label: string;
  values: number[];
};

function Sparkline({
  label,
  values,
}: SparklineProps) {
  const finiteValues =
    values.filter((value) =>
      Number.isFinite(value),
    );

  if (finiteValues.length === 0) {
    return (
      <span
        aria-hidden="true"
        className={styles.noChart}
      />
    );
  }

  const series =
    finiteValues.length === 1
      ? [
          finiteValues[0],
          finiteValues[0],
        ]
      : finiteValues;

  const maximum = Math.max(
    ...series,
  );

  const minimum = Math.min(
    ...series,
  );

  const range =
    maximum - minimum || 1;

  const points = series
    .map((value, index) => {
      const x =
        (index /
          (series.length - 1)) *
        100;

      const y =
        32 -
        ((value - minimum) /
          range) *
          26;

      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      aria-hidden="true"
      className={styles.sparkline}
      data-label={label}
      focusable="false"
      preserveAspectRatio="none"
      viewBox="0 0 100 36"
    >
      <polyline
        points={points}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function KpiStrip({
  items,
}: KpiStripProps) {
  return (
    <section
      aria-label="مؤشرات الأداء الرئيسية"
      className={styles.grid}
      role="list"
    >
      {items.map((item) => {
        const valueLabel = [
          item.value,
          item.unit,
        ]
          .filter(Boolean)
          .join(" ");

        const trendLabel =
          item.trend === "up"
            ? "اتجاه صاعد"
            : "اتجاه هابط";

        return (
          <DashboardPanel
            aria-label={`${item.title}: ${valueLabel}`}
            className={`${styles.card} ${styles[`tone-${item.tone}`]}`}
            action={
              <span
                aria-hidden="true"
                className={
                  styles.icon
                }
              >
                {item.icon}
              </span>
            }
            footer={
              <Badge
                aria-label={`${trendLabel}: ${item.change}`}
                className={
                  styles.trendBadge
                }
                size="sm"
                tone={
                  item.trend === "up"
                    ? "success"
                    : "danger"
                }
              >
                <span
                  aria-hidden="true"
                  className={
                    styles.trendIcon
                  }
                >
                  {item.trend === "up"
                    ? "↑"
                    : "↓"}
                </span>

                {item.change}
              </Badge>
            }
            key={item.id}
            padding="none"
            role="listitem"
            title={item.title}
          >
            <div className={styles.main}>
              <div
                className={
                  styles.valueBlock
                }
              >
                <strong>
                  {item.value}
                </strong>

                {item.unit ? (
                  <small>
                    {item.unit}
                  </small>
                ) : null}
              </div>

              <Sparkline
                label={item.title}
                values={item.chart}
              />
            </div>
          </DashboardPanel>
        );
      })}
    </section>
  );
}
