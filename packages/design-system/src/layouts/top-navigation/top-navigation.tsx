import type { HTMLAttributes, ReactNode } from "react";

export type TopNavigationProps = HTMLAttributes<HTMLElement> & {
  start?: ReactNode;
  center?: ReactNode;
  end?: ReactNode;
};

export function TopNavigation({
  start,
  center,
  end,
  className = "",
  ...props
}: TopNavigationProps) {
  return (
    <div
      className={["odsTopNavigation", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      <div className="odsTopNavigation__start">{start}</div>

      <div className="odsTopNavigation__center">{center}</div>

      <div className="odsTopNavigation__end">{end}</div>
    </div>
  );
}

export function TopNavigationSearch({
  placeholder = "ابحث...",
  shortcut,
  icon,
}: {
  placeholder?: string;
  shortcut?: string;
  icon?: ReactNode;
}) {
  return (
    <label className="odsTopNavigationSearch">
      {icon ? (
        <span className="odsTopNavigationSearch__icon">
          {icon}
        </span>
      ) : null}

      <input
        aria-label={placeholder}
        placeholder={placeholder}
        type="search"
      />

      {shortcut ? (
        <kbd>{shortcut}</kbd>
      ) : null}
    </label>
  );
}

export function TopNavigationAction({
  children,
  label,
  badge,
}: {
  children: ReactNode;
  label: string;
  badge?: ReactNode;
}) {
  return (
    <button
      aria-label={label}
      className="odsTopNavigationAction"
      type="button"
    >
      {children}

      {badge ? (
        <span className="odsTopNavigationAction__badge">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

export function TopNavigationUser({
  avatar,
  name,
  role,
  action,
}: {
  avatar: ReactNode;
  name: string;
  role?: string;
  action?: ReactNode;
}) {
  return (
    <div className="odsTopNavigationUser">
      {avatar}

      <div className="odsTopNavigationUser__content">
        <strong>{name}</strong>
        {role ? <small>{role}</small> : null}
      </div>

      {action ? (
        <span className="odsTopNavigationUser__action">
          {action}
        </span>
      ) : null}
    </div>
  );
}
