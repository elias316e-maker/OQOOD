import type {
  HTMLAttributes,
  ReactNode,
} from "react";

export type AlertTone =
  | "info"
  | "success"
  | "warning"
  | "danger";

export type AlertProps =
  HTMLAttributes<HTMLDivElement> & {
    tone?: AlertTone;
    title?: ReactNode;
    children: ReactNode;
  };

export function Alert({
  tone = "info",
  title,
  children,
  className,
  ...props
}: AlertProps) {
  const classes = [
    "oqoodAlert",
    `oqoodAlert--${tone}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classes}
      role={
        tone === "danger"
          ? "alert"
          : "status"
      }
      {...props}
    >
      {title ? (
        <strong className="oqoodAlert__title">
          {title}
        </strong>
      ) : null}

      <div className="oqoodAlert__content">
        {children}
      </div>
    </div>
  );
}
