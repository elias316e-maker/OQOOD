import type {
  CommandCenterPerformanceData,
  PerformancePoint,
} from "@/features/command-center";
import styles from "./performance-analytics.module.css";

type PerformanceAnalyticsProps = {
  data: CommandCenterPerformanceData;
};

function buildPolyline(
  points: PerformancePoint[],
  key: "contracts" | "procurement",
) {
  const values = points.map((point) => point[key]);
  const maximum = Math.max(...values);
  const minimum = Math.min(...values);
  const range = maximum - minimum || 1;

  return points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * 100;
      const y = 74 - ((point[key] - minimum) / range) * 58;

      return `${x},${y}`;
    })
    .join(" ");
}

export function PerformanceAnalytics({
  data,
}: PerformanceAnalyticsProps) {
  const contractPoints = buildPolyline(data.points, "contracts");
  const procurementPoints = buildPolyline(data.points, "procurement");

  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <div>
          <h2>الأداء المالي والتشغيلي</h2>
          <p>
            مقارنة قيمة العقود والمشتريات خلال الفترة المحددة.
          </p>
        </div>

        <select defaultValue="six-months">
          <option value="six-months">{data.periodLabel}</option>
          <option value="year">هذا العام</option>
          <option value="quarter">آخر 3 أشهر</option>
        </select>
      </header>

      <div className={styles.legend}>
        <span>
          <i className={styles.contractDot} />
          قيمة العقود
        </span>

        <span>
          <i className={styles.procurementDot} />
          حجم المشتريات
        </span>
      </div>

      <div className={styles.chart}>
        <div className={styles.chartGrid} />

        <svg
          aria-label="رسم أداء العقود والمشتريات"
          role="img"
          viewBox="0 0 100 82"
        >
          <defs>
            <linearGradient
              id="contractArea"
              x1="0"
              x2="0"
              y1="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#3b82f6"
                stopOpacity=".28"
              />
              <stop
                offset="100%"
                stopColor="#3b82f6"
                stopOpacity="0"
              />
            </linearGradient>

            <linearGradient
              id="procurementArea"
              x1="0"
              x2="0"
              y1="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#8b5cf6"
                stopOpacity=".2"
              />
              <stop
                offset="100%"
                stopColor="#8b5cf6"
                stopOpacity="0"
              />
            </linearGradient>
          </defs>

          <polygon
            className={styles.contractArea}
            points={`0,82 ${contractPoints} 100,82`}
          />

          <polygon
            className={styles.procurementArea}
            points={`0,82 ${procurementPoints} 100,82`}
          />

          <polyline
            className={styles.contractLine}
            points={contractPoints}
          />

          <polyline
            className={styles.procurementLine}
            points={procurementPoints}
          />
        </svg>

        <div className={styles.labels}>
          {data.points.map((point) => (
            <span key={point.label}>{point.label}</span>
          ))}
        </div>
      </div>

      <div className={styles.metrics}>
        {data.metrics.map((metric) => (
          <article
            className={`${styles.metric} ${
              styles[`tone-${metric.tone}`]
            }`}
            key={metric.id}
          >
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small
              className={
                metric.trend === "up"
                  ? styles.positive
                  : styles.negative
              }
            >
              {metric.change}
            </small>
          </article>
        ))}
      </div>
    </section>
  );
}
