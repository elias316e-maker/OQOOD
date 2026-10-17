import {
  WorkspaceHeader,
} from "@oqood/design-system";

import styles from "./notifications.module.css";

export default function NotificationsLoading() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className={styles.page}
    >
      <WorkspaceHeader
        className={styles.header}
        eyebrow="متابعة استباقية موحّدة"
        title="جاري تحميل الإشعارات..."
        description="يتم تجهيز التنبيهات والمواعيد والقرارات المعلّقة."
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
                    className={`${styles.skeleton} ${styles.skeletonDescription}`}
                  />

                  <span
                    className={`${styles.skeleton} ${styles.skeletonTime}`}
                  />
                </div>

                <span
                  className={`${styles.skeleton} ${styles.skeletonAction}`}
                />
              </article>
            ),
          )}
        </div>
      </section>
    </main>
  );
}
