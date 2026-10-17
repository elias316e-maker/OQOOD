import type {
  HTMLAttributes,
  ReactNode,
} from "react";

export type WorkspaceHeaderProps =
  HTMLAttributes<HTMLElement> & {
    eyebrow?: ReactNode;
    title: ReactNode;
    description?: ReactNode;
    badge?: ReactNode;
    actions?: ReactNode;
  };

export function WorkspaceHeader({
  eyebrow,
  title,
  description,
  badge,
  actions,
  className,
  ...props
}: WorkspaceHeaderProps) {
  const classes = [
    "oqoodWorkspaceHeader",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section
      className={classes}
      {...props}
    >
      <div className="oqoodWorkspaceHeader__identity">
        <div className="oqoodWorkspaceHeader__eyebrowRow">
          {eyebrow ? (
            <span className="oqoodWorkspaceHeader__eyebrow">
              {eyebrow}
            </span>
          ) : null}

          {badge ? (
            <span className="oqoodWorkspaceHeader__badge">
              {badge}
            </span>
          ) : null}
        </div>

        <h1 className="oqoodWorkspaceHeader__title">
          {title}
        </h1>

        {description ? (
          <p className="oqoodWorkspaceHeader__description">
            {description}
          </p>
        ) : null}
      </div>

      {actions ? (
        <div className="oqoodWorkspaceHeader__actions">
          {actions}
        </div>
      ) : null}
    </section>
  );
}
