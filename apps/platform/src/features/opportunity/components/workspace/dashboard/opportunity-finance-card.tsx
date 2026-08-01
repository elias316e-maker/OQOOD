type OpportunityFinanceItem = {
  label: string;
  value: string;
  helper?: string;
  tone?: "default" | "positive" | "warning";
};

type OpportunityFinanceCardProps = {
  items: readonly OpportunityFinanceItem[];
};

export function OpportunityFinanceCard({
  items,
}: OpportunityFinanceCardProps) {
  return (
    <article className="opportunityWorkspaceCard opportunityFinanceCard">
      <header className="workspaceSectionHeader">
        <div>
          <span className="pageEyebrow">
            المعلومات المالية
          </span>

          <h2>القيمة والميزانية</h2>

          <p>
            البيانات المالية الداخلية المرتبطة بالمنافسة.
          </p>
        </div>
      </header>

      <dl className="opportunityFinanceCard__list">
        {items.map((item) => (
          <div
            className={
              `opportunityFinanceCard__item ` +
              `is-${item.tone ?? "default"}`
            }
            key={item.label}
          >
            <dt>{item.label}</dt>

            <dd>{item.value || "غير محدد"}</dd>

            {item.helper && (
              <small>{item.helper}</small>
            )}
          </div>
        ))}
      </dl>
    </article>
  );
}
