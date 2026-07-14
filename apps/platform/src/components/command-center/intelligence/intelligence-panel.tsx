import type {
  AiInsight,
  CommandCenterIntelligenceData,
} from "@/features/command-center";
import styles from "./intelligence-panel.module.css";

type IntelligencePanelProps = {
  data: CommandCenterIntelligenceData;
};

function InsightItem({ insight }: { insight: AiInsight }) {
  return (
    <article
      className={`${styles.insight} ${
        styles[`tone-${insight.tone}`]
      }`}
    >
      <span className={styles.insightIcon} aria-hidden="true">
        {insight.icon}
      </span>

      <div className={styles.insightContent}>
        <strong>{insight.title}</strong>
        <p>{insight.description}</p>
      </div>

      <button type="button">
        {insight.actionLabel}
      </button>
    </article>
  );
}

export function IntelligencePanel({
  data,
}: IntelligencePanelProps) {
  return (
    <section className={styles.panel}>
      <div className={styles.backgroundGrid} />
      <div className={styles.glow} />

      <header className={styles.header}>
        <div>
          <span className={styles.aiLabel}>
            <span aria-hidden="true">✦</span>
            OQOOD Intelligence
          </span>

          <h2>رؤى وتحليلات ذكية</h2>

          <p>
            توصيات مبنية على بيانات المنافسات والعقود
            والمشاريع الحالية.
          </p>
        </div>

        <button className={styles.viewAll} type="button">
          عرض جميع التحليلات
        </button>
      </header>

      <div className={styles.content}>
        <article className={styles.scoreCard}>
          <span>احتمالية الفوز في المنافسات</span>

          <div className={styles.scoreMain}>
            <strong>{data.winProbability}%</strong>

            <div
              aria-label={`احتمالية الفوز ${data.winProbability}%`}
              className={styles.scoreRing}
              role="img"
              style={
                {
                  "--score-angle":
                    `${data.winProbability * 3.6}deg`,
                } as React.CSSProperties
              }
            >
              <span>{data.winProbability}%</span>
            </div>
          </div>

          <footer>
            <span>↑ {data.change}</span>
            تحسن عن الشهر الماضي
          </footer>
        </article>

        <div className={styles.insights}>
          <div className={styles.insightsHeader}>
            <strong>أهم التوصيات</strong>
            <span>تم تحديثها الآن</span>
          </div>

          {data.insights.map((insight) => (
            <InsightItem insight={insight} key={insight.id} />
          ))}
        </div>
      </div>

      <button className={styles.commandBar} type="button">
        <span>اسأل مساعد OQOOD الذكي أي سؤال...</span>
        <strong aria-hidden="true">✦</strong>
      </button>
    </section>
  );
}
