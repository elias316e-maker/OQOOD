import styles from "./page.module.css";

export default function ProcurementLoading() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className={styles.page}
    >
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>
            دورة الشراء الداخلية
          </span>
          <h1>جاري تحميل طلبات المشتريات...</h1>
          <p>يتم تجهيز بيانات مساحة العمل الحالية.</p>
        </div>
      </header>

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
                style={{ marginBlockEnd: "0.6rem" }}
              />
            ),
          )}
        </div>
      </section>
    </main>
  );
}

