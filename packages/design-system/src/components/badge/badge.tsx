import type { HTMLAttributes, ReactNode } from "react";

export type BadgeTone =
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

export type BadgeSize = "sm" | "md";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  tone?: BadgeTone;
  size?: BadgeSize;
  dot?: boolean;
};

export function Badge({
  children,
  tone = "neutral",
  size = "md",
  dot = false,
  className = "",
  ...props
}: BadgeProps) {
  return (
    <span
      className={[
        "odsBadge",
        `odsBadge--${tone}`,
        `odsBadge--${size}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {dot ? <span className="odsBadge__dot" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
