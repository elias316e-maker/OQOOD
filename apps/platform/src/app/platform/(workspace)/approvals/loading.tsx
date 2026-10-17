import {
  WorkspaceHeader,
} from "@oqood/design-system";

import styles from "./approvals.module.css";

export default function ApprovalsLoading() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className={styles.page}
    >
      <WorkspaceHeader
        className={styles.header}
        eyebrow="صندوق القرارات"
        title="جاري تحميل الموافقات..."
        description="يتم تجهيز الطلبات والمنافسات والعقود التي تنتظر المراجعة أو القرار."
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
        <div className={styles.loadingList}>
          {Array.from(
            { length: 6 },
            (_, index) => (
              <article
                className={styles.loadingRow}
                key={index}
              >
                <span
                  className={`${styles.skeleton} ${styles.skeletonKind}`}
                />

                <div
                  className={styles.loadingContent}
                >
                  <span
                    className={`${styles.skeleton} ${styles.skeletonTitle}`}
                  />

                  <span
                    className={`${styles.skeleton} ${styles.skeletonNumber}`}
                  />
                </div>

                <div
                  className={styles.loadingAge}
                >
                  <span
                    className={`${styles.skeleton} ${styles.skeletonAge}`}
                  />

                  <span
                    className={`${styles.skeleton} ${styles.skeletonPermission}`}
                  />
                </div>

                <span
                  className={`${styles.skeleton} ${styles.skeletonArrow}`}
                />
              </article>
            ),
          )}
        </div>
      </section>
    </main>
  );
}
