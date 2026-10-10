import {
  WorkspaceHeader,
} from "@oqood/design-system";

import styles from "./page.module.css";

function LoadingPanel({
  rows = 4,
}: {
  rows?: number;
}) {
  return (
    <section className={styles.loadingPanel}>
      <div
        className={
          styles.loadingPanelHeader
        }
      >
        <div
          className={
            styles.loadingPanelTitle
          }
        >
          <span
            className={`${styles.skeleton} ${styles.skeletonShort}`}
          />

          <span
            className={`${styles.skeleton} ${styles.skeletonMedium}`}
          />
        </div>

        <span
          className={`${styles.skeleton} ${styles.skeletonTiny}`}
        />
      </div>

      <div className={styles.loadingRows}>
        {Array.from(
          { length: rows },
          (_, index) => (
            <div
              className={styles.loadingRow}
              key={index}
            >
              <span
                className={`${styles.skeleton} ${styles.skeletonIcon}`}
              />

              <div
                className={
                  styles.loadingRowBody
                }
              >
                <span
                  className={`${styles.skeleton} ${styles.skeletonRowTitle}`}
                />

                <span
                  className={`${styles.skeleton} ${styles.skeletonRowDescription}`}
                />
              </div>

              <span
                className={`${styles.skeleton} ${styles.skeletonControl}`}
              />
            </div>
          ),
        )}
      </div>
    </section>
  );
}

export default function WorkspaceLoading() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className={styles.page}
    >
      <section
        aria-hidden="true"
        className={styles.routeHero}
      >
        <WorkspaceHeader
          className={styles.loadingHeader}
          eyebrow="مساحة العمل"
          title="جاري تجهيز مركز القيادة..."
          description="يتم تحميل المؤشرات التشغيلية والمنافسات والعقود والمهام والإشعارات."
        />

        <div
          className={
            styles.loadingAlerts
          }
        >
          {Array.from(
            { length: 4 },
            (_, index) => (
              <article
                className={
                  styles.loadingAlert
                }
                key={index}
              >
                <span
                  className={`${styles.skeleton} ${styles.skeletonIcon}`}
                />

                <div
                  className={
                    styles.loadingAlertBody
                  }
                >
                  <span
                    className={`${styles.skeleton} ${styles.skeletonValue}`}
                  />

                  <span
                    className={`${styles.skeleton} ${styles.skeletonMedium}`}
                  />

                  <span
                    className={`${styles.skeleton} ${styles.skeletonTiny}`}
                  />
                </div>
              </article>
            ),
          )}
        </div>
      </section>

      <section
        aria-hidden="true"
        className={styles.loadingKpis}
      >
        {Array.from(
          { length: 5 },
          (_, index) => (
            <article
              className={
                styles.loadingKpi
              }
              key={index}
            >
              <span
                className={`${styles.skeleton} ${styles.skeletonLabel}`}
              />

              <span
                className={`${styles.skeleton} ${styles.skeletonValue}`}
              />

              <span
                className={`${styles.skeleton} ${styles.skeletonNote}`}
              />
            </article>
          ),
        )}
      </section>

      {Array.from(
        { length: 5 },
        (_, index) => (
          <section
            aria-hidden="true"
            className={
              styles.loadingDualRow
            }
            key={index}
          >
            <LoadingPanel
              rows={
                index === 0
                  ? 3
                  : 4
              }
            />

            <LoadingPanel
              rows={
                index === 4
                  ? 5
                  : 4
              }
            />
          </section>
        ),
      )}
    </main>
  );
}
