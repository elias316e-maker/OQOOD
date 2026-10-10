import type {
  CSSProperties,
} from "react";

import Link from "next/link";

import {
  Badge,
  DashboardPanel,
  WorkspaceHeader,
} from "@oqood/design-system";

import type {
  CommandCenterAlert,
  CommandCenterData,
} from "@/features/command-center";

import styles from "./command-hero.module.css";

type CommandHeroProps = {
  data: CommandCenterData;
};

function AlertCard({
  alert,
}: {
  alert: CommandCenterAlert;
}) {
  return (
    <article
      className={`${styles.alertCard} ${styles[`tone-${alert.tone}`]}`}
      role="listitem"
    >
      <span
        aria-hidden="true"
        className={styles.alertIcon}
      >
        {alert.icon}
      </span>

      <div>
        <strong>{alert.value}</strong>

        <span>{alert.title}</span>

        <small>
          {alert.description}
        </small>
      </div>
    </article>
  );
}

export function CommandHero({
  data,
}: CommandHeroProps) {
  const progress = Math.min(
    100,
    Math.max(
      0,
      data.hero.progress.percentage,
    ),
  );

  const progressLabel =
    progress >= 75
      ? "ممتاز"
      : progress >= 40
        ? "قيد التقدم"
        : "يحتاج متابعة";

  const progressTone:
    | "success"
    | "info"
    | "warning" =
    progress >= 75
      ? "success"
      : progress >= 40
        ? "info"
        : "warning";

  return (
    <section
      aria-label="ملخص مركز القيادة التشغيلي"
      className={styles.hero}
    >
      <div
        aria-hidden="true"
        className={styles.gridPattern}
      />

      <div
        aria-hidden="true"
        className={styles.glowOne}
      />

      <div
        aria-hidden="true"
        className={styles.glowTwo}
      />

      <div className={styles.main}>
        <div className={styles.intro}>
          <WorkspaceHeader
            badge={
              <time className={styles.date}>
                {data.date}
              </time>
            }
            className={styles.heroHeader}
            description={
              data.hero.description
            }
            eyebrow={
              <Badge
                className={
                  styles.liveBadge
                }
                dot
                size="sm"
                tone="success"
              >
                {data.hero.eyebrow}
              </Badge>
            }
            title={data.hero.title}
          />

          <div
            aria-label="التنبيهات التشغيلية المختصرة"
            className={styles.alerts}
            role="list"
          >
            {data.hero.alerts.map(
              (alert) => (
                <AlertCard
                  alert={alert}
                  key={alert.id}
                />
              ),
            )}
          </div>
        </div>

        <DashboardPanel
          action={
            <Badge
              size="sm"
              tone={progressTone}
            >
              {progressLabel}
            </Badge>
          }
          aria-label="تقدم أعمال اليوم"
          className={styles.progressCard}
          description="يتم التحديث تلقائيًا"
          footer={
            <div
              className={
                styles.progressFooter
              }
            >
              <p>
                تم إنجاز
                <strong>
                  {" "}
                  {
                    data.hero.progress
                      .completed
                  }{" "}
                </strong>
                من أصل
                <strong>
                  {" "}
                  {
                    data.hero.progress
                      .total
                  }{" "}
                </strong>
                مهمة.
              </p>

              <Link
                className={
                  styles.startAction
                }
                href="/platform/approvals"
              >
                ابدأ العمل
              </Link>
            </div>
          }
          padding="none"
          title="تقدم أعمال اليوم"
        >
          <div
            aria-label={`نسبة تقدم أعمال اليوم: ${progress}%`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={progress}
            aria-valuetext={`${progress}% مكتمل`}
            className={
              styles.progressRing
            }
            role="progressbar"
            style={
              {
                "--progress-angle":
                  `${progress * 3.6}deg`,
              } as CSSProperties
            }
          >
            <div>
              <strong>
                {progress}%
              </strong>

              <span>مكتمل</span>
            </div>
          </div>
        </DashboardPanel>
      </div>
    </section>
  );
}
