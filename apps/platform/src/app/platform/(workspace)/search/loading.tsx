import {
  WorkspaceHeader,
} from "@oqood/design-system";

import styles from "./search.module.css";

export default function SearchLoading() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className={styles.page}
    >
      <WorkspaceHeader
        className={styles.workspaceHeader}
        eyebrow="البحث الشامل"
        title="جاري تحميل نتائج البحث..."
        description="يتم البحث داخل المشاريع والمشتريات والمنافسات والعقود والموردين والمستندات."
      />

      <section
        aria-hidden="true"
        className={styles.loadingSearch}
      >
        <span
          className={`${styles.skeleton} ${styles.skeletonSearchIcon}`}
        />

        <span
          className={`${styles.skeleton} ${styles.skeletonSearchInput}`}
        />

        <span
          className={`${styles.skeleton} ${styles.skeletonSearchButton}`}
        />
      </section>

      <div
        aria-hidden="true"
        className={styles.loadingGroups}
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
                <div
                  className={
                    styles.loadingGroupIdentity
                  }
                >
                  <span
                    className={`${styles.skeleton} ${styles.skeletonGroupIcon}`}
                  />

                  <div>
                    <span
                      className={`${styles.skeleton} ${styles.skeletonEyebrow}`}
                    />

                    <span
                      className={`${styles.skeleton} ${styles.skeletonGroupTitle}`}
                    />
                  </div>
                </div>

                <span
                  className={`${styles.skeleton} ${styles.skeletonGroupCount}`}
                />
              </div>

              <div
                className={
                  styles.loadingResults
                }
              >
                {Array.from(
                  { length: 3 },
                  (_, resultIndex) => (
                    <div
                      className={
                        styles.loadingResult
                      }
                      key={resultIndex}
                    >
                      <span
                        className={`${styles.skeleton} ${styles.skeletonResultIcon}`}
                      />

                      <div
                        className={
                          styles.loadingResultBody
                        }
                      >
                        <span
                          className={`${styles.skeleton} ${styles.skeletonResultTitle}`}
                        />

                        <span
                          className={`${styles.skeleton} ${styles.skeletonResultDescription}`}
                        />
                      </div>

                      <div
                        className={
                          styles.loadingMeta
                        }
                      >
                        <span
                          className={`${styles.skeleton} ${styles.skeletonStatus}`}
                        />

                        <span
                          className={`${styles.skeleton} ${styles.skeletonDate}`}
                        />
                      </div>

                      <span
                        className={`${styles.skeleton} ${styles.skeletonArrow}`}
                      />
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
