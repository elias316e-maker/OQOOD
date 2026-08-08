import type {
  ReactNode,
} from "react";

type WorkspaceSectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

export function WorkspaceSectionHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: WorkspaceSectionHeaderProps) {
  return (
    <header
      className={[
        "workspaceSectionHeader",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div>
        {eyebrow && (
          <span className="opportunityWorkspaceSectionEyebrow">
            {eyebrow}
          </span>
        )}

        <h2>{title}</h2>

        {description && (
          <p>{description}</p>
        )}
      </div>

      {actions && (
        <div className="workspaceSectionHeader__actions">
          {actions}
        </div>
      )}
    </header>
  );
}
