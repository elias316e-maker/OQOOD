import type { ReactNode } from "react";

export type TooltipPlacement = "top" | "bottom" | "start" | "end";

export type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
  placement?: TooltipPlacement;
};

export function Tooltip({
  content,
  children,
  placement = "top",
}: TooltipProps) {
  return (
    <span
      className="odsTooltip"
      data-placement={placement}
    >
      <span className="odsTooltip__trigger">{children}</span>

      <span
        className="odsTooltip__content"
        role="tooltip"
      >
        {content}
      </span>
    </span>
  );
}
