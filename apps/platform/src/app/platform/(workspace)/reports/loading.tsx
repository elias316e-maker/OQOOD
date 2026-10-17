import {
  WorkspaceHeader,
} from "@oqood/design-system";

import styles from "./reports.module.css";

export default function ReportsLoading() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className={styles.page}
    >
      <WorkspaceHeader
        className={styles.workspaceHeader}
        eyebrow="ذكاء الأعمال التشغيلي"
        title="جاري تحميل التقارير..."
        description="يتم تجهيز مؤشرات المشتريات والمنافسات والعقود والموردين."
      />

      <section
        aria-hidden="true"
        className={styles.kpis}
      >
        {Array.from(
          { length: 5 },
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
        className={styles.loadingGrid}
      >
        {Array.from(
          { length: 2 },
          (_, panelIndex) => (
            <article
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
                  className={`${styles.skeleton} ${styles.skeletonLink}`}
                />
              </div>

              <div
                className={
                  styles.loadingDistribution
                }
              >
                {Array.from(
                  { length: 4 },
                  (_, rowIndex) => (
                    <div
                      className={
                        styles.loadingDistributionRow
                      }
                      key={rowIndex}
                    >
                      <div>
                        <span
                          className={`${styles.skeleton} ${styles.skeletonDistributionLabel}`}
                        />

                        <span
                          className={`${styles.skeleton} ${styles.skeletonCount}`}
                        />
                      </div>

                      <span
                        className={`${styles.skeleton} ${styles.skeletonProgress}`}
                      />
                    </div>
                  ),
                )}
              </div>
            </article>
          ),
        )}
      </section>

      <section
        aria-hidden="true"
        className={
          styles.loadingFinancePanel
        }
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
        </div>

        <div
          className={
            styles.loadingFinanceGrid
          }
        >
          {Array.from(
            { length: 3 },
            (_, index) => (
              <article key={index}>
                <span
                  className={`${styles.skeleton} ${styles.skeletonFinanceLabel}`}
                />

                <span
                  className={`${styles.skeleton} ${styles.skeletonFinanceValue}`}
                />

                <span
                  className={`${styles.skeleton} ${styles.skeletonProgress}`}
                />

                <span
                  className={`${styles.skeleton} ${styles.skeletonFinanceNote}`}
                />
              </article>
            ),
          )}
        </div>
      </section>

      <section
        aria-hidden="true"
        className={
          styles.loadingTablePanel
        }
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
        </div>

        <div className={styles.loadingTable}>
          {Array.from(
            { length: 5 },
            (_, index) => (
              <div
                className={
                  styles.loadingTableRow
                }
                key={index}
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
    </main>
  );
}
