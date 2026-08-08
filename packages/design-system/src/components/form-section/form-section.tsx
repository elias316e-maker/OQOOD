import type {
  HTMLAttributes,
  ReactNode,
} from "react";

export type FormSectionProps =
  HTMLAttributes<HTMLElement> & {
    eyebrow?: ReactNode;
    title: ReactNode;
    description?: ReactNode;
    actions?: ReactNode;
    children?: ReactNode;
  };

export function FormSection({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
  ...props
}: FormSectionProps) {
  const classes = [
    "oqoodFormSection",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section
      className={classes}
      {...props}
    >
      <header className="oqoodFormSection__header">
        <div className="oqoodFormSection__identity">
          {eyebrow ? (
            <span className="oqoodFormSection__eyebrow">
              {eyebrow}
            </span>
          ) : null}

          <h2 className="oqoodFormSection__title">
            {title}
          </h2>

          {description ? (
            <p className="oqoodFormSection__description">
              {description}
            </p>
          ) : null}
        </div>

        {actions ? (
          <div className="oqoodFormSection__actions">
            {actions}
          </div>
        ) : null}
      </header>

      {children ? (
        <div className="oqoodFormSection__content">
          {children}
        </div>
      ) : null}
    </section>
  );
}
