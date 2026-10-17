import type { HTMLAttributes, ReactNode } from "react";

export type AppShellSidebarWidth = "sm" | "md" | "lg";

export type AppShellProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  sidebar?: ReactNode;
  header?: ReactNode;
  rightPanel?: ReactNode;
  sidebarWidth?: AppShellSidebarWidth;
  sidebarCollapsed?: boolean;
  mobileSidebarOpen?: boolean;
  onMobileSidebarClose?: () => void;
};

export function AppShell({
  children,
  sidebar,
  header,
  rightPanel,
  sidebarWidth = "md",
  sidebarCollapsed = false,
  mobileSidebarOpen = false,
  onMobileSidebarClose,
  className = "",
  ...props
}: AppShellProps) {
  return (
    <div
      className={[
        "odsAppShell",
        `odsAppShell--sidebar-${sidebarWidth}`,
        sidebarCollapsed ? "odsAppShell--collapsed" : "",
        rightPanel ? "odsAppShell--withRightPanel" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {sidebar ? (
        <>
          <aside
            className={[
              "odsAppShell__sidebar",
              mobileSidebarOpen ? "odsAppShell__sidebar--mobileOpen" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {sidebar}
          </aside>

          {mobileSidebarOpen ? (
            <button
              aria-label="إغلاق القائمة الجانبية"
              className="odsAppShell__overlay"
              onClick={onMobileSidebarClose}
              type="button"
            />
          ) : null}
        </>
      ) : null}

      <div className="odsAppShell__workspace">
        {header ? (
          <header className="odsAppShell__header">
            {header}
          </header>
        ) : null}

        <div className="odsAppShell__body">
          <main className="odsAppShell__content">
            {children}
          </main>

          {rightPanel ? (
            <aside className="odsAppShell__rightPanel">
              {rightPanel}
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  );
}
