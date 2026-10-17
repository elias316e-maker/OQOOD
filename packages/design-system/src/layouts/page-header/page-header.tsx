import type { HTMLAttributes, ReactNode } from "react";

export type PageHeaderProps = HTMLAttributes<HTMLElement> & {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  breadcrumb?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumb,
  actions,
  meta,
  className = "",
  ...props
}: PageHeaderProps) {
  return (
    <header
      className={["odsPageHeader", className].filter(Boolean).join(" ")}
      {...props}
    >
      <div className="odsPageHeader__main">
        {breadcrumb ? (
          <div className="odsPageHeader__breadcrumb">{breadcrumb}</div>
        ) : null}

        {eyebrow ? (
          <span className="odsPageHeader__eyebrow">{eyebrow}</span>
        ) : null}

        <div className="odsPageHeader__titleRow">
          <div>
            <h1>{title}</h1>

            {description ? (
              <p>{description}</p>
            ) : null}
          </div>

          {actions ? (
            <div className="odsPageHeader__actions">{actions}</div>
          ) : null}
        </div>

        {meta ? (
          <div className="odsPageHeader__meta">{meta}</div>
        ) : null}
      </div>
    </header>
  );
}
