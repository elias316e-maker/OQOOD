import type {
  HTMLAttributes,
  ReactNode,
} from "react";

export type FormGuidanceProps =
  HTMLAttributes<HTMLDivElement> & {
    icon?: ReactNode;
    title: ReactNode;
    description?: ReactNode;
  };

export function FormGuidance({
  icon,
  title,
  description,
  className,
  ...props
}: FormGuidanceProps) {
  const classes = [
    "oqoodFormGuidance",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classes}
      {...props}
    >
      {icon ? (
        <span
          className="oqoodFormGuidance__icon"
          aria-hidden="true"
        >
          {icon}
        </span>
      ) : null}

      <div className="oqoodFormGuidance__content">
        <strong className="oqoodFormGuidance__title">
          {title}
        </strong>

        {description ? (
          <small className="oqoodFormGuidance__description">
            {description}
          </small>
        ) : null}
      </div>
    </div>
  );
}
