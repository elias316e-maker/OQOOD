import type { ReactNode } from "react";

export type BreadcrumbItem = {
  label: ReactNode;
  href?: string;
  current?: boolean;
};

export type BreadcrumbProps = {
  items: BreadcrumbItem[];
  separator?: ReactNode;
  className?: string;
};

export function Breadcrumb({
  items,
  separator = "/",
  className = "",
}: BreadcrumbProps) {
  return (
    <nav
      aria-label="مسار الصفحة"
      className={["odsBreadcrumb", className].filter(Boolean).join(" ")}
    >
      <ol>
        {items.map((item, index) => (
          <li key={index}>
            {item.href && !item.current ? (
              <a href={item.href}>{item.label}</a>
            ) : (
              <span aria-current={item.current ? "page" : undefined}>
                {item.label}
              </span>
            )}

            {index < items.length - 1 ? (
              <span className="odsBreadcrumb__separator" aria-hidden="true">
                {separator}
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}
