export default function OpportunitiesLoading() {
  return (
    <main
      className="platformContent"
      aria-busy="true"
      aria-live="polite"
    >
      <section className="listPageHeader">
        <div>
          <span className="pageEyebrow">
            إدارة الفرص
          </span>

          <h1>جارٍ تحميل الفرص...</h1>

          <p>
            يتم الآن تجهيز بيانات مساحة العمل.
          </p>
        </div>
      </section>

      <section
        className="listSummaryCards"
        aria-hidden="true"
      >
        {Array.from({ length: 4 }).map(
          (_, index) => (
            <article
              className="opportunitySkeletonCard"
              key={index}
            >
              <span className="skeletonLine skeletonLineShort" />
              <strong className="skeletonLine skeletonLineValue" />
              <small className="skeletonLine" />
            </article>
          ),
        )}
      </section>

      <section
        className="dashboardPanel opportunityListPanel"
        aria-hidden="true"
      >
        <div className="opportunitySkeletonToolbar">
          <span className="skeletonLine skeletonLineWide" />
          <span className="skeletonLine skeletonLineMedium" />
        </div>

        <div className="opportunitySkeletonTable">
          {Array.from({ length: 6 }).map(
            (_, index) => (
              <div
                className="opportunitySkeletonRow"
                key={index}
              >
                <span className="skeletonLine skeletonLineShort" />
                <span className="skeletonLine skeletonLineWide" />
                <span className="skeletonLine skeletonLineMedium" />
                <span className="skeletonLine skeletonLineShort" />
              </div>
            ),
          )}
        </div>
      </section>
    </main>
  );
}
