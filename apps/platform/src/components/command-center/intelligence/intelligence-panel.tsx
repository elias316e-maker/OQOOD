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
  AiInsight,
  CommandCenterIntelligenceData,
} from "@/features/command-center";

import styles from "./intelligence-panel.module.css";

type IntelligencePanelProps = {
  data: CommandCenterIntelligenceData;
};

const insightBadgeTones: Record<
  AiInsight["tone"],
  | "info"
  | "primary"
  | "success"
  | "warning"
  | "danger"
> = {
  blue: "info",
  purple: "primary",
  green: "success",
  orange: "warning",
  red: "danger",
};

function InsightItem({
  insight,
}: {
  insight: AiInsight;
}) {
  return (
    <article
      className={`${styles.insight} ${styles[`tone-${insight.tone}`]}`}
      role="listitem"
    >
      <span
        aria-hidden="true"
        className={styles.insightIcon}
      >
        {insight.icon}
      </span>

      <div
        className={
          styles.insightContent
        }
      >
        <div
          className={
            styles.insightHeading
          }
        >
          <strong>
            {insight.title}
          </strong>

          <Badge
            size="sm"
            tone={
              insightBadgeTones[
                insight.tone
              ]
            }
          >
            توصية
          </Badge>
        </div>

        <p>
          {insight.description}
        </p>
      </div>

      <Link
        aria-label={`${insight.actionLabel}: ${insight.title}`}
        className={
          styles.insightAction
        }
        href={insight.href}
      >
        {insight.actionLabel}

        <span aria-hidden="true">
          ←
        </span>
      </Link>
    </article>
  );
}

export function IntelligencePanel({
  data,
}: IntelligencePanelProps) {
  const probability = Math.min(
    100,
    Math.max(
      0,
      data.winProbability,
    ),
  );

  const probabilityTone:
    | "success"
    | "info"
    | "warning" =
    probability >= 70
      ? "success"
      : probability >= 35
        ? "info"
        : "warning";

  return (
    <DashboardPanel
      action={
        <div
          className={
            styles.headerActions
          }
        >
          <Badge
            className={styles.aiBadge}
            size="sm"
            tone="primary"
          >
            ✦ OQOOD Intelligence
          </Badge>

          <Link
            className={styles.viewAll}
            href="/platform/reports"
          >
            عرض جميع التحليلات
          </Link>
        </div>
      }
      aria-label="رؤى وتحليلات OQOOD الذكية"
      className={styles.panel}
      description="توصيات مبنية على بيانات المنافسات والعقود والمشاريع الحالية."
      footer={
        <Link
          aria-label="فتح البحث الشامل في OQOOD"
          className={
            styles.commandBar
          }
          href="/platform/search"
        >
          <span>
            اسأل مساعد OQOOD الذكي
            أو ابحث في مساحة العمل...
          </span>

          <strong aria-hidden="true">
            ✦
          </strong>
        </Link>
      }
      padding="none"
      title="رؤى وتحليلات ذكية"
    >
      <div className={styles.content}>
        <DashboardPanel
          action={
            <Badge
              size="sm"
              tone={probabilityTone}
            >
              {probability >= 70
                ? "فرصة قوية"
                : probability >= 35
                  ? "قابلة للتحسين"
                  : "تحتاج متابعة"}
            </Badge>
          }
          aria-label="احتمالية الفوز في المنافسات"
          className={
            styles.scoreCard
          }
          footer={
            <div
              className={
                styles.scoreFooter
              }
            >
              <Badge
                size="sm"
                tone="info"
              >
                {data.change}
              </Badge>

              <span>
                ضمن بيانات المنافسات
                الحالية
              </span>
            </div>
          }
          padding="none"
          title="احتمالية الفوز في المنافسات"
        >
          <div
            className={styles.scoreMain}
          >
            <strong>
              {probability}%
            </strong>

            <div
              aria-label={`احتمالية الفوز في المنافسات: ${probability}%`}
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={
                probability
              }
              aria-valuetext={`${probability}%`}
              className={
                styles.scoreRing
              }
              role="progressbar"
              style={
                {
                  "--score-angle":
                    `${probability * 3.6}deg`,
                } as CSSProperties
              }
            >
              <span>
                {probability}%
              </span>
            </div>
          </div>
        </DashboardPanel>

        <section
          aria-labelledby="command-insights-title"
          className={
            styles.insightsSection
          }
        >
          <div
            className={
              styles.insightsHeader
            }
          >
            <div>
              <h3 id="command-insights-title">
                أهم التوصيات
              </h3>

              <p>
                قرارات ومواعيد ومخاطر
                تستحق المتابعة.
              </p>
            </div>

            <Badge
              size="sm"
              tone="neutral"
            >
              {data.insights.length}
              {" توصيات"}
            </Badge>
          </div>

          {data.insights.length >
          0 ? (
            <div
              className={
                styles.insights
              }
              role="list"
            >
              {data.insights.map(
                (insight) => (
                  <InsightItem
                    insight={insight}
                    key={insight.id}
                  />
                ),
              )}
            </div>
          ) : (
            <EmptyState
              className={
                styles.empty
              }
              icon="✦"
              title="لا توجد توصيات حالية"
              description="لا توجد قرارات أو مخاطر جديدة تحتاج إلى متابعة الآن."
              role="status"
              tone="success"
            />
          )}
        </section>
      </div>
    </DashboardPanel>
  );
}
