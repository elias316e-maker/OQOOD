import {
  Badge,
  DashboardPanel,
  EmptyState,
} from "@oqood/design-system";

import type {
  CommandCenterPerformanceData,
  PerformancePoint,
} from "@/features/command-center";

import styles from "./performance-analytics.module.css";

type PerformanceAnalyticsProps = {
  data: CommandCenterPerformanceData;
};

type SeriesKey =
  | "contracts"
  | "procurement";

function buildPolyline(
  points: PerformancePoint[],
  key: SeriesKey,
): string {
  if (points.length === 0) {
    return "";
  }

  const values = points.map(
    (point) =>
      Number.isFinite(point[key])
        ? point[key]
        : 0,
  );

  const series =
    values.length === 1
      ? [values[0], values[0]]
      : values;

  const maximum = Math.max(
    ...series,
  );

  const minimum = Math.min(
    ...series,
  );

  const range =
    maximum - minimum || 1;

  return series
    .map((value, index) => {
      const x =
        (index /
          (series.length - 1)) *
        100;

      const y =
        72 -
        ((value - minimum) /
          range) *
          56;

      return `${x},${y}`;
    })
    .join(" ");
}

export function PerformanceAnalytics({
  data,
}: PerformanceAnalyticsProps) {
  const hasPoints =
    data.points.length > 0;

  const contractPoints =
    hasPoints
      ? buildPolyline(
          data.points,
          "contracts",
        )
      : "";

  const procurementPoints =
    hasPoints
      ? buildPolyline(
          data.points,
          "procurement",
        )
      : "";

  return (
    <DashboardPanel
      action={
        <Badge
          className={styles.periodBadge}
          size="sm"
          tone="info"
        >
          {data.periodLabel}
        </Badge>
      }
      aria-label="الأداء المالي والتشغيلي"
      className={styles.panel}
      description="مقارنة قيمة العقود والمشتريات خلال الفترة المعروضة."
      padding="none"
      title="الأداء المالي والتشغيلي"
    >
      <div className={styles.analytics}>
        {hasPoints ? (
          <section
            aria-label="رسم أداء العقود والمشتريات"
            className={
              styles.chartSection
            }
          >
            <div
              aria-label="مفتاح الرسم البياني"
              className={styles.legend}
            >
              <span>
                <span
                  aria-hidden="true"
                  className={
                    styles.contractDot
                  }
                />

                قيمة العقود
              </span>

              <span>
                <span
                  aria-hidden="true"
                  className={
                    styles.procurementDot
                  }
                />

                حجم المشتريات
              </span>
            </div>

            <div className={styles.chart}>
              <div
                aria-hidden="true"
                className={
                  styles.chartGrid
                }
              />

              <svg
                aria-label={`مقارنة قيمة العقود وحجم المشتريات خلال ${data.periodLabel}`}
                preserveAspectRatio="none"
                role="img"
                viewBox="0 0 100 82"
              >
                <title>
                  الأداء المالي والتشغيلي
                </title>

                <desc>
                  يوضح اتجاه قيمة العقود
                  وحجم المشتريات عبر
                  الفترات المعروضة.
                </desc>

                <defs>
                  <linearGradient
                    id="commandCenterContractArea"
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
                    id="commandCenterProcurementArea"
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
                  className={
                    styles.contractArea
                  }
                  points={`0,82 ${contractPoints} 100,82`}
                />

                <polygon
                  className={
                    styles.procurementArea
                  }
                  points={`0,82 ${procurementPoints} 100,82`}
                />

                <polyline
                  className={
                    styles.contractLine
                  }
                  points={contractPoints}
                  vectorEffect="non-scaling-stroke"
                />

                <polyline
                  className={
                    styles.procurementLine
                  }
                  points={procurementPoints}
                  vectorEffect="non-scaling-stroke"
                />
              </svg>

              <div
                aria-hidden="true"
                className={styles.labels}
              >
                {data.points.map(
                  (point, index) => (
                    <span
                      key={`${point.label}-${index}`}
                    >
                      {point.label}
                    </span>
                  ),
                )}
              </div>

              <ul className={styles.srOnly}>
                {data.points.map(
                  (point, index) => (
                    <li
                      key={`${point.label}-data-${index}`}
                    >
                      {point.label}:
                      {" قيمة العقود "}
                      {point.contracts},
                      {" حجم المشتريات "}
                      {point.procurement}
                    </li>
                  ),
                )}
              </ul>
            </div>
          </section>
        ) : (
          <EmptyState
            className={styles.empty}
            icon="⌁"
            title="لا توجد بيانات أداء"
            description="لا توجد قيم عقود أو مشتريات كافية لإنشاء الرسم البياني حتى الآن."
            role="status"
          />
        )}

        {data.metrics.length > 0 ? (
          <div
            aria-label="مؤشرات الأداء المساندة"
            className={styles.metrics}
            role="list"
          >
            {data.metrics.map(
              (metric) => (
                <article
                  aria-label={`${metric.label}: ${metric.value}، ${metric.change}`}
                  className={`${styles.metric} ${styles[`tone-${metric.tone}`]}`}
                  key={metric.id}
                  role="listitem"
                >
                  <div
                    className={
                      styles.metricHeading
                    }
                  >
                    <span>
                      {metric.label}
                    </span>

                    <Badge
                      className={
                        styles.metricChange
                      }
                      size="sm"
                      tone={
                        metric.trend ===
                        "up"
                          ? "success"
                          : "danger"
                      }
                    >
                      <span
                        aria-hidden="true"
                      >
                        {metric.trend ===
                        "up"
                          ? "↑"
                          : "↓"}
                      </span>

                      {metric.change}
                    </Badge>
                  </div>

                  <strong>
                    {metric.value}
                  </strong>
                </article>
              ),
            )}
          </div>
        ) : null}
      </div>
    </DashboardPanel>
  );
}
