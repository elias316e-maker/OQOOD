import {
  WorkspaceHeader,
} from "@oqood/design-system";

import styles from "./calendar.module.css";

export default function CalendarLoading() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className={styles.page}
    >
      <WorkspaceHeader
        className={styles.header}
        eyebrow="المواعيد التشغيلية"
        title="جاري تحميل التقويم..."
        description="يتم تجهيز مواعيد المنافسات والمشتريات والعقود ومراحل التنفيذ."
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

      <div
        aria-hidden="true"
        className={styles.loadingGrid}
      >
        {Array.from(
          { length: 4 },
          (_, groupIndex) => (
            <section
              className={styles.loadingGroup}
              key={groupIndex}
            >
              <div
                className={
                  styles.loadingGroupHeader
                }
              >
                <span
                  className={`${styles.skeleton} ${styles.skeletonGroupTitle}`}
                />

                <span
                  className={`${styles.skeleton} ${styles.skeletonCount}`}
                />
              </div>

              <div
                className={
                  styles.loadingGroupBody
                }
              >
                {Array.from(
                  { length: 3 },
                  (_, eventIndex) => (
                    <div
                      className={
                        styles.loadingEvent
                      }
                      key={eventIndex}
                    >
                      <span
                        className={`${styles.skeleton} ${styles.skeletonDate}`}
                      />

                      <div
                        className={
                          styles.loadingEventContent
                        }
                      >
                        <span
                          className={`${styles.skeleton} ${styles.skeletonKind}`}
                        />

                        <span
                          className={`${styles.skeleton} ${styles.skeletonEventTitle}`}
                        />

                        <span
                          className={`${styles.skeleton} ${styles.skeletonDetail}`}
                        />
                      </div>
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
