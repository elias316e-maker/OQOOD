type OpportunityKpiTone =
  | "purple"
  | "blue"
  | "green"
  | "amber"
  | "rose"
  | "neutral";

export type OpportunityKpiItem = {
  label: string;
  value: string;
  helper?: string;
  icon?: string;
  tone?: OpportunityKpiTone;
};

type OpportunityKpiGridProps = {
  items: readonly OpportunityKpiItem[];
};

export function OpportunityKpiGrid({
  items,
}: OpportunityKpiGridProps) {
  return (
    <section
      className="opportunityKpiGrid"
      aria-label="مؤشرات المنافسة"
    >
      {items.map((item) => (
        <article
          className={
            `opportunityKpiCard ` +
            `opportunityKpiCard--${item.tone ?? "neutral"}`
          }
          key={item.label}
        >
          <div className="opportunityKpiCard__top">
            <span className="opportunityKpiCard__icon" aria-hidden="true">
              {item.icon ?? "◇"}
            </span>

            <span className="opportunityKpiCard__label">
              {item.label}
            </span>
          </div>

          <strong className="opportunityKpiCard__value">
            {item.value}
          </strong>

          {item.helper && (
            <small className="opportunityKpiCard__helper">
              {item.helper}
            </small>
          )}
        </article>
      ))}
    </section>
  );
}
