import type { ReactNode } from "react";
import { AppShell } from "@oqood/design-system";
import { Sidebar } from "@/components/platform/sidebar";
import { PlatformTopbar } from "@/components/platform/topbar";

export default function PlatformLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <AppShell
      className="platformDarkShell"
      header={<PlatformTopbar />}
      sidebar={<Sidebar />}
      sidebarWidth="sm"
    >
      {children}
    </AppShell>
  );
}
