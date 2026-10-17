import type { ReactNode } from "react";

type BadgeTone =
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "neutral";

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  return <span className={`uiBadge uiBadge-${tone}`}>{children}</span>;
}
