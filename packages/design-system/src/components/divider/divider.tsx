import type { HTMLAttributes } from "react";

export type DividerOrientation = "horizontal" | "vertical";

export type DividerProps = HTMLAttributes<HTMLHRElement> & {
  orientation?: DividerOrientation;
  decorative?: boolean;
};

export function Divider({
  orientation = "horizontal",
  decorative = true,
  className = "",
  ...props
}: DividerProps) {
  return (
    <hr
      aria-hidden={decorative}
      className={[
        "odsDivider",
        `odsDivider--${orientation}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
