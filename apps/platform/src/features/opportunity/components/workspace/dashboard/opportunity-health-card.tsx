type OpportunityHealthItem = {
  label: string;
  completed: boolean;
};

type OpportunityHealthCardProps = {
  score: number;
  items: readonly OpportunityHealthItem[];
};

export function OpportunityHealthCard({
  score,
  items,
}: OpportunityHealthCardProps) {
  const normalizedScore = Math.min(
    100,
    Math.max(0, Math.round(score)),
  );

  return (
    <article className="opportunityWorkspaceCard opportunityHealthCardV2">
      <header className="workspaceSectionHeader">
        <div>
          <span className="opportunityDashboardCardEyebrow">
            Competition Health
          </span>

          <h2>جاهزية المنافسة</h2>

          <p>
            ملخص اكتمال البيانات والمتطلبات الأساسية قبل النشر والتقييم.
          </p>
        </div>
      </header>

      <div className="opportunityHealthCardV2__score">
        <div
          className="opportunityHealthCardV2__ring"
          style={{
            background:
              `conic-gradient(` +
              `#35d399 ${normalizedScore}%, ` +
              `rgba(112, 122, 157, 0.15) 0)`,
          }}
          aria-label={`نسبة جاهزية المنافسة ${normalizedScore}%`}
        >
          <div>
            <strong>{normalizedScore}%</strong>
            <span>مكتملة</span>
          </div>
        </div>
      </div>

      <div className="opportunityHealthCardV2__items">
        {items.map((item) => (
          <div key={item.label}>
            <span
              className={
                item.completed
                  ? "is-complete"
                  : "is-pending"
              }
              aria-hidden="true"
            >
              {item.completed ? "✓" : "!"}
            </span>

            <strong>{item.label}</strong>

            <small>
              {item.completed
                ? "مكتمل"
                : "يحتاج متابعة"}
            </small>
          </div>
        ))}
      </div>
    </article>
  );
}
