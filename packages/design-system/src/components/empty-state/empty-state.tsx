import type {
  HTMLAttributes,
  ReactNode,
} from "react";

export type EmptyStateProps =
  HTMLAttributes<HTMLElement> & {
    icon?: ReactNode;
    title: ReactNode;
    description?: ReactNode;
    actions?: ReactNode;
    tone?: "neutral" | "info" | "success" | "warning" | "danger";
  };

export function EmptyState({
  icon,
  title,
  description,
  actions,
  tone = "neutral",
  className,
  ...props
}: EmptyStateProps) {
  const classes = [
    "oqoodEmptyState",
    `oqoodEmptyState--${tone}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section
      className={classes}
      {...props}
    >
      {icon ? (
        <div
          className="oqoodEmptyState__icon"
          aria-hidden="true"
        >
          {icon}
        </div>
      ) : null}

      <div className="oqoodEmptyState__content">
        <h2 className="oqoodEmptyState__title">
          {title}
        </h2>

        {description ? (
          <p className="oqoodEmptyState__description">
            {description}
          </p>
        ) : null}
      </div>

      {actions ? (
        <div className="oqoodEmptyState__actions">
          {actions}
        </div>
      ) : null}
    </section>
  );
}
