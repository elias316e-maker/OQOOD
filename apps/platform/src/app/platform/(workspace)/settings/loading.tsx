import {
  WorkspaceHeader,
} from "@oqood/design-system";

import styles from "./settings.module.css";

export default function SettingsLoading() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className={styles.page}
    >
      <WorkspaceHeader
        className={styles.workspaceHeader}
        eyebrow="إدارة المنصة"
        title="جاري تحميل الإعدادات..."
        description="يتم تجهيز بيانات مساحة العمل والفريق والأدوار وأمان الحساب."
      />

      <div
        aria-hidden="true"
        className={styles.loadingStack}
      >
        {Array.from(
          { length: 4 },
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
                <div
                  className={
                    styles.loadingPanelIdentity
                  }
                >
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
                  styles.loadingPanelBody
                }
              >
                {Array.from(
                  {
                    length:
                      panelIndex === 1
                        ? 4
                        : 3,
                  },
                  (_, rowIndex) => (
                    <div
                      className={
                        styles.loadingRow
                      }
                      key={rowIndex}
                    >
                      <div
                        className={
                          styles.loadingRowIdentity
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
          ),
        )}
      </div>
    </main>
  );
}
