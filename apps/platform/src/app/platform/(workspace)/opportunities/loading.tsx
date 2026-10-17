import styles from "./page.module.css";
import skeleton from "./loading.module.css";

import {
  DashboardPanel,
  WorkspaceHeader,
} from "@oqood/design-system";

export default function OpportunitiesLoading() {
  return (
    <main
      className={styles.page}
      aria-busy="true"
      aria-live="polite"
    >
      <WorkspaceHeader
      eyebrow="إدارة المنافسات"
      title="جارٍ تحميل المنافسات..."
      description="يتم الآن تجهيز بيانات مساحة العمل."
    />

      <section
        className={styles.summary}
        aria-hidden="true"
      >
        {Array.from({ length: 5 }).map(
          (_, index) => (
            <article
              className={skeleton.card}
              key={index}
            >
              <span className={`${skeleton.line} ${skeleton.short}`} />
              <strong className={`${skeleton.line} ${skeleton.value}`} />
              <small className={skeleton.line} />
            </article>
          ),
        )}
      </section>

      <DashboardPanel aria-hidden="true">
        <div className={skeleton.toolbar}>
          <span className={`${skeleton.line} ${skeleton.wide}`} />
          <span className={`${skeleton.line} ${skeleton.medium}`} />
        </div>

        <div className={skeleton.table}>
          {Array.from({ length: 6 }).map(
            (_, index) => (
              <div
                className={skeleton.row}
                key={index}
              >
                <span className={`${skeleton.line} ${skeleton.short}`} />
                <span className={`${skeleton.line} ${skeleton.wide}`} />
                <span className={`${skeleton.line} ${skeleton.medium}`} />
                <span className={`${skeleton.line} ${skeleton.short}`} />
              </div>
            ),
          )}
        </div>
      </DashboardPanel>
    </main>
  );
}
