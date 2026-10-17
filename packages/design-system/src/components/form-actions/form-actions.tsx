import type {
  HTMLAttributes,
  ReactNode,
} from "react";

export type FormActionsProps =
  HTMLAttributes<HTMLDivElement> & {
    status?: ReactNode;
    children: ReactNode;
    sticky?: boolean;
  };

export function FormActions({
  status,
  children,
  sticky = false,
  className,
  ...props
}: FormActionsProps) {
  const classes = [
    "oqoodFormActions",
    sticky
      ? "oqoodFormActions--sticky"
      : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classes}
      {...props}
    >
      {status ? (
        <div className="oqoodFormActions__status">
          {status}
        </div>
      ) : (
        <span />
      )}

      <div className="oqoodFormActions__buttons">
        {children}
      </div>
    </div>
  );
}
