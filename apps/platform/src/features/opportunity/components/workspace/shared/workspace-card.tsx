import type {
  ComponentPropsWithoutRef,
  ElementType,
  ReactNode,
} from "react";

type WorkspaceCardProps<T extends ElementType = "section"> = {
  as?: T;
  children: ReactNode;
  className?: string;
} & Omit<
  ComponentPropsWithoutRef<T>,
  "as" | "children" | "className"
>;

export function WorkspaceCard<T extends ElementType = "section">({
  as,
  children,
  className,
  ...props
}: WorkspaceCardProps<T>) {
  const Component = as ?? "section";

  return (
    <Component
      className={[
        "opportunityWorkspaceCard",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </Component>
  );
}
