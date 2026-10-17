import Link from "next/link";

type OpportunityQuickAction = {
  label: string;
  href: string;
  helper?: string;
  icon?: string;
  tone?: "default" | "primary" | "warning" | "danger";
};

type OpportunityQuickActionsProps = {
  actions: readonly OpportunityQuickAction[];
  title?: string;
  description?: string;
};

export function OpportunityQuickActions({
  actions,
  title = "إجراءات المنافسة",
  description = "الوصول السريع إلى أهم أقسام وإجراءات المنافسة.",
}: OpportunityQuickActionsProps) {
  return (
    <article className="opportunityWorkspaceCard opportunityQuickActions">
      <header className="workspaceSectionHeader">
        <div>
          <span className="opportunityDashboardCardEyebrow">
            الوصول السريع
          </span>

          <h2>{title}</h2>

          <p>{description}</p>
        </div>
      </header>

      <div className="opportunityQuickActions__list">
        {actions.map((action) => (
          <Link
            className={
              `opportunityQuickActions__item ` +
              `is-${action.tone ?? "default"}`
            }
            href={action.href}
            key={`${action.label}-${action.href}`}
          >
            <span
              className="opportunityQuickActions__icon"
              aria-hidden="true"
            >
              {action.icon ?? "◇"}
            </span>

            <span className="opportunityQuickActions__content">
              <strong>{action.label}</strong>

              {action.helper && (
                <small>{action.helper}</small>
              )}
            </span>

            <span
              className="opportunityQuickActions__arrow"
              aria-hidden="true"
            >
              ←
            </span>
          </Link>
        ))}
      </div>
    </article>
  );
}
