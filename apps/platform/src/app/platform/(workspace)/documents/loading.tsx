import {
  WorkspaceHeader,
} from "@oqood/design-system";

import styles from "./documents.module.css";

export default function DocumentsLoading() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className={styles.page}
    >
      <WorkspaceHeader
        className={styles.header}
        eyebrow="مستودع موحّد وآمن"
        title="جاري تحميل المستندات..."
        description="يتم تجهيز الملفات وحالات المراجعة والنسخ والكيانات المرتبطة."
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
        className={`${styles.panel} ${styles.loadingPanel}`}
      >
        <div className={styles.loadingRows}>
          {Array.from(
            { length: 6 },
            (_, index) => (
              <div
                className={styles.loadingRow}
                key={index}
              >
                <span
                  className={`${styles.skeleton} ${styles.skeletonFile}`}
                />

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
