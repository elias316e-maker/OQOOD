import type { CSSProperties } from "react";
import { Button } from "@oqood/design-system";
import type {
  CommandCenterAlert,
  CommandCenterData,
} from "@/features/command-center";
import styles from "./command-hero.module.css";

type CommandHeroProps = {
  data: CommandCenterData;
};

function AlertCard({ alert }: { alert: CommandCenterAlert }) {
  return (
    <article
      className={`${styles.alertCard} ${styles[`tone-${alert.tone}`]}`}
    >
      <span className={styles.alertIcon} aria-hidden="true">
        {alert.icon}
      </span>

      <div>
        <strong>{alert.value}</strong>
        <span>{alert.title}</span>
        <small>{alert.description}</small>
      </div>
    </article>
  );
}

export function CommandHero({ data }: CommandHeroProps) {
  const progress = data.hero.progress.percentage;

  return (
    <section className={styles.hero}>
      <div className={styles.gridPattern} />
      <div className={styles.glowOne} />
      <div className={styles.glowTwo} />

      <div className={styles.main}>
        <div className={styles.intro}>
          <span className={styles.date}>{data.date}</span>

          <span className={styles.eyebrow}>
            <span className={styles.liveDot} />
            {data.hero.eyebrow}
          </span>

          <h1>
            {data.hero.title}
            <span> 👋</span>
          </h1>

          <p>{data.hero.description}</p>

          <div className={styles.alerts}>
            {data.hero.alerts.map((alert) => (
              <AlertCard alert={alert} key={alert.id} />
            ))}
          </div>
        </div>

        <aside className={styles.progressCard}>
          <header>
            <div>
              <strong>تقدم أعمال اليوم</strong>
              <span>يتم التحديث تلقائيًا</span>
            </div>

            <span className={styles.progressStatus}>ممتاز</span>
          </header>

          <div
            className={styles.progressRing}
            style={
              {
                "--progress-angle": `${progress * 3.6}deg`,
              } as CSSProperties
            }
          >
            <div>
              <strong>{progress}%</strong>
              <span>مكتمل</span>
            </div>
          </div>

          <p>
            تم إنجاز
            <strong> {data.hero.progress.completed} </strong>
            من أصل
            <strong> {data.hero.progress.total} </strong>
            مهمة.
          </p>

          <Button fullWidth size="md">
            ابدأ العمل
          </Button>
        </aside>
      </div>
    </section>
  );
}
