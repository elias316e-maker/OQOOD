import {
  WorkspaceHeader,
} from "@oqood/design-system";

import styles from "./partners.module.css";

export default function PartnersLoading() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className={styles.page}
    >
      <WorkspaceHeader
        className={styles.header}
        eyebrow="دليل المنشأة"
        title="جاري تحميل شركاء الأعمال..."
        description="يتم تجهيز بيانات الموردين والمقاولين والتوثيق والمشاركات في المنافسات."
      />

      <section
        aria-hidden="true"
        className={styles.summary}
      >
        {Array.from(
          { length: 3 },
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

            <span
              className={`${styles.skeleton} ${styles.skeletonPanelDescription}`}
            />
          </div>

          <span
            className={`${styles.skeleton} ${styles.skeletonPanelMeta}`}
          />
        </div>

        <div className={styles.loadingTable}>
          <div
            className={
              styles.loadingTableHeader
            }
          >
            {Array.from(
              { length: 6 },
              (_, index) => (
                <span
                  className={`${styles.skeleton} ${styles.skeletonHeaderCell}`}
                  key={index}
                />
              ),
            )}
          </div>

          {Array.from(
            { length: 6 },
            (_, rowIndex) => (
              <div
                className={
                  styles.loadingTableRow
                }
                key={rowIndex}
              >
                <div
                  className={
                    styles.loadingIdentity
                  }
                >
                  <span
                    className={`${styles.skeleton} ${styles.skeletonAvatar}`}
                  />

                  <div>
                    <span
                      className={`${styles.skeleton} ${styles.skeletonPartnerName}`}
                    />

                    <span
                      className={`${styles.skeleton} ${styles.skeletonReference}`}
                    />
                  </div>
                </div>

                {Array.from(
                  { length: 5 },
                  (_, cellIndex) => (
                    <span
                      className={`${styles.skeleton} ${styles.skeletonCell}`}
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
