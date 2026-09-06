import {
  WorkspaceHeader,
} from "@oqood/design-system";

import styles from "./projects.module.css";

export default function ProjectsLoading() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className={styles.page}
    >
      <WorkspaceHeader
        className={styles.header}
        eyebrow="محفظة الأعمال"
        title="جاري تحميل المشاريع..."
        description="يتم تجهيز بيانات الميزانيات والمشتريات والمنافسات والعقود."
      />

      <section
        aria-hidden="true"
        className={styles.summary}
      >
        {Array.from(
          { length: 4 },
          (_, index) => (
            <article key={index}>
              <span
                className={`${styles.skeleton} ${styles.skeletonLabel}`}
              />

              <strong
                className={`${styles.skeleton} ${styles.skeletonValue}`}
              />

              <small
                className={`${styles.skeleton} ${styles.skeletonNote}`}
              />
            </article>
          ),
        )}
      </section>

      <section
        aria-hidden="true"
        className={`${styles.panel} ${styles.loadingPanel}`}
      >
        <div className={styles.loadingCards}>
          {Array.from(
            { length: 4 },
            (_, index) => (
              <article
                className={styles.loadingCard}
                key={index}
              >
                <div
                  className={styles.loadingCardHead}
                >
                  <span
                    className={`${styles.skeleton} ${styles.skeletonCode}`}
                  />

                  <span
                    className={`${styles.skeleton} ${styles.skeletonTitle}`}
                  />
                </div>

                <div
                  className={styles.loadingMetrics}
                >
                  {Array.from(
                    { length: 4 },
                    (_, metricIndex) => (
                      <span
                        className={`${styles.skeleton} ${styles.skeletonMetric}`}
                        key={metricIndex}
                      />
                    ),
                  )}
                </div>

                <span
                  className={`${styles.skeleton} ${styles.skeletonProgress}`}
                />
              </article>
            ),
          )}
        </div>
      </section>
    </main>
  );
}
