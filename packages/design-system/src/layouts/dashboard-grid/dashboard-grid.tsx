import type { HTMLAttributes, ReactNode } from "react";

export type DashboardGridColumns = 1 | 2 | 3 | 4;

export type DashboardGridProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  columns?: DashboardGridColumns;
};

export function DashboardGrid({
  children,
  columns = 4,
  className = "",
  ...props
}: DashboardGridProps) {
  return (
    <div
      className={[
        "odsDashboardGrid",
        `odsDashboardGrid--${columns}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}

export type DashboardGridItemProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  span?: 1 | 2 | 3 | 4 | "full";
};

export function DashboardGridItem({
  children,
  span = 1,
  className = "",
  ...props
}: DashboardGridItemProps) {
  return (
    <section
      className={[
        "odsDashboardPanel",
        `odsDashboardPanel--span-${span}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </section>
  );
}
