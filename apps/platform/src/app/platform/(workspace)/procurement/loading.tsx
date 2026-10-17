import {
  WorkspaceHeader,
} from "@oqood/design-system";

import styles from "./page.module.css";

export default function ProcurementLoading() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className={styles.page}
    >
      <WorkspaceHeader
        className={styles.header}
        eyebrow="دورة الشراء الداخلية"
        title="جاري تحميل طلبات المشتريات..."
        description="يتم تجهيز بيانات مساحة العمل الحالية."
      />

      <section
        aria-hidden="true"
        className={styles.summary}
      >
        {Array.from({ length: 4 }).map(
          (_, index) => (
            <article key={index}>
              <div className={styles.skeleton} />
            </article>
          ),
        )}
      </section>

      <section
        aria-hidden="true"
        className={styles.panel}
      >
        <div className={styles.filters}>
          {Array.from({ length: 4 }).map(
            (_, index) => (
              <div
                className={styles.skeleton}
                key={index}
              />
            ),
          )}
        </div>

        <div style={{ padding: "1rem" }}>
          {Array.from({ length: 7 }).map(
            (_, index) => (
              <div
                className={styles.skeleton}
                key={index}
                style={{
                  marginBlockEnd: "0.6rem",
                }}
              />
            ),
          )}
        </div>
      </section>
    </main>
  );
}
