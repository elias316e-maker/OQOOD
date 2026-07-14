import type { HTMLAttributes, ReactNode } from "react";

export type SidebarProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  collapsed?: boolean;
};

export function Sidebar({
  children,
  collapsed = false,
  className = "",
  ...props
}: SidebarProps) {
  return (
    <nav
      aria-label="القائمة الرئيسية"
      className={[
        "odsSidebar",
        collapsed ? "odsSidebar--collapsed" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </nav>
  );
}

export function SidebarHeader({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={["odsSidebar__header", className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </header>
  );
}

export function SidebarContent({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={["odsSidebar__content", className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

export function SidebarFooter({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <footer
      className={["odsSidebar__footer", className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </footer>
  );
}

export function SidebarGroup({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={["odsSidebarGroup", className]
        .filter(Boolean)
        .join(" ")}
    >
      {title ? (
        <span className="odsSidebarGroup__title">{title}</span>
      ) : null}

      <div className="odsSidebarGroup__items">{children}</div>
    </section>
  );
}

export type SidebarNavItemProps = {
  label: string;
  icon?: ReactNode;
  badge?: ReactNode;
  active?: boolean;
  collapsed?: boolean;
  description?: string;
};

export function SidebarNavItem({
  label,
  icon,
  badge,
  active = false,
  collapsed = false,
  description,
}: SidebarNavItemProps) {
  return (
    <span
      aria-current={active ? "page" : undefined}
      className={[
        "odsSidebarNavItem",
        active ? "odsSidebarNavItem--active" : "",
        collapsed ? "odsSidebarNavItem--collapsed" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      title={collapsed ? label : undefined}
    >
      {icon ? (
        <span className="odsSidebarNavItem__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}

      {!collapsed ? (
        <span className="odsSidebarNavItem__content">
          <strong>{label}</strong>
          {description ? <small>{description}</small> : null}
        </span>
      ) : null}

      {!collapsed && badge ? (
        <span className="odsSidebarNavItem__badge">{badge}</span>
      ) : null}
    </span>
  );
}

export function SidebarWorkspace({
  logo,
  name,
  description,
  action,
  collapsed = false,
}: {
  logo: ReactNode;
  name: string;
  description?: string;
  action?: ReactNode;
  collapsed?: boolean;
}) {
  return (
    <div
      className={[
        "odsSidebarWorkspace",
        collapsed ? "odsSidebarWorkspace--collapsed" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="odsSidebarWorkspace__logo">{logo}</span>

      {!collapsed ? (
        <>
          <span className="odsSidebarWorkspace__content">
            <strong>{name}</strong>
            {description ? <small>{description}</small> : null}
          </span>

          {action ? (
            <span className="odsSidebarWorkspace__action">{action}</span>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
