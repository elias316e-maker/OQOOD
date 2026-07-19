import type { HTMLAttributes, ReactNode } from "react";

export type DashboardPanelProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  footer?: ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
};

export function DashboardPanel({
  children,
  title,
  description,
  action,
  footer,
  padding = "md",
  className = "",
  ...props
}: DashboardPanelProps) {
  return (
    <article
      className={[
        "odsDashboardPanelCard",
        `odsDashboardPanelCard--padding-${padding}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {title || description || action ? (
        <header className="odsDashboardPanelCard__header">
          <div>
            {title ? (
              <h2 className="odsDashboardPanelCard__title">{title}</h2>
            ) : null}

            {description ? (
              <p className="odsDashboardPanelCard__description">
                {description}
              </p>
            ) : null}
          </div>

          {action ? (
            <div className="odsDashboardPanelCard__action">
              {action}
            </div>
          ) : null}
        </header>
      ) : null}

      <div className="odsDashboardPanelCard__body">
        {children}
      </div>

      {footer ? (
        <footer className="odsDashboardPanelCard__footer">
          {footer}
        </footer>
      ) : null}
    </article>
  );
}
