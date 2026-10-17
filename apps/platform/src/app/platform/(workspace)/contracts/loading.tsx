import {
  WorkspaceHeader,
} from "@oqood/design-system";

import styles from "./contracts.module.css";

export default function ContractsLoading() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className={styles.page}
    >
      <WorkspaceHeader
        className={styles.header}
        eyebrow="إدارة دورة التعاقد والتنفيذ"
        title="جاري تحميل العقود..."
        description="يتم تجهيز بيانات العقود والمراحل والموقف المالي."
      />

      <section
        aria-hidden="true"
        className={styles.kpis}
      >
        {Array.from({ length: 6 }).map(
          (_, index) => (
            <article key={index}>
              <span
                className={`${styles.skeleton} ${styles.skeletonLabel}`}
              />

              <strong
                className={`${styles.skeleton} ${styles.skeletonValue}`}
              />
            </article>
          ),
        )}
      </section>

      <section
        aria-hidden="true"
        className={`${styles.panel} ${styles.loadingPanel}`}
      >
        <div className={styles.skeletonRows}>
          {Array.from({ length: 7 }).map(
            (_, rowIndex) => (
              <div
                className={styles.skeletonRow}
                key={rowIndex}
              >
                {Array.from({ length: 7 }).map(
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
