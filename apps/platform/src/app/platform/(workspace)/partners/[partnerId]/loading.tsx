import {
  WorkspaceHeader,
} from "@oqood/design-system";

import styles from "./partner-scorecard.module.css";

export default function PartnerDetailsLoading() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className={styles.page}
    >
      <WorkspaceHeader
        className={styles.header}
        eyebrow="بطاقة أداء المورد"
        title="جاري تحميل بيانات الشريك..."
        description="يتم تجهيز العقود والتقييمات ومؤشرات الأداء والمستندات المرتبطة."
      />

      <section
        aria-hidden="true"
        className={styles.kpis}
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

      <div
        aria-hidden="true"
        className={styles.loadingStack}
      >
        <section className={styles.loadingPanel}>
          <div
            className={
              styles.loadingPanelHeader
            }
          >
            <div>
              <span
                className={`${styles.skeleton} ${styles.skeletonEyebrow}`}
              />

              <span
                className={`${styles.skeleton} ${styles.skeletonPanelTitle}`}
              />
            </div>

            <span
              className={`${styles.skeleton} ${styles.skeletonPanelMeta}`}
            />
          </div>

          <div
            className={
              styles.loadingScoreGrid
            }
          >
            {Array.from(
              { length: 4 },
              (_, index) => (
                <article
                  className={
                    styles.loadingScore
                  }
                  key={index}
                >
                  <div>
                    <span
                      className={`${styles.skeleton} ${styles.skeletonScoreLabel}`}
                    />

                    <span
                      className={`${styles.skeleton} ${styles.skeletonScoreValue}`}
                    />
                  </div>

                  <span
                    className={`${styles.skeleton} ${styles.skeletonProgress}`}
                  />
                </article>
              ),
            )}
          </div>
        </section>

        {Array.from(
          { length: 3 },
          (_, panelIndex) => (
            <section
              className={styles.loadingPanel}
              key={panelIndex}
            >
              <div
                className={
                  styles.loadingPanelHeader
                }
              >
                <div>
                  <span
                    className={`${styles.skeleton} ${styles.skeletonEyebrow}`}
                  />

                  <span
                    className={`${styles.skeleton} ${styles.skeletonPanelTitle}`}
                  />
                </div>

                <span
                  className={`${styles.skeleton} ${styles.skeletonPanelMeta}`}
                />
              </div>

              <div
                className={
                  styles.loadingTable
                }
              >
                {Array.from(
                  { length: 4 },
                  (_, rowIndex) => (
                    <div
                      className={
                        styles.loadingTableRow
                      }
                      key={rowIndex}
                    >
                      {Array.from(
                        { length: 4 },
                        (_, cellIndex) => (
                          <span
                            className={`${styles.skeleton} ${styles.skeletonTableCell}`}
                            key={cellIndex}
                          />
                        ),
                      )}
                    </div>
                  ),
                )}
              </div>
            </section>
          ),
        )}
      </div>
    </main>
  );
}
