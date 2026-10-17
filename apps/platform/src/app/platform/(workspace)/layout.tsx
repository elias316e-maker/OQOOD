import type { ReactNode } from "react";

import { AppShell } from "@oqood/design-system";

import { Sidebar } from "@/components/platform/sidebar";
import { PlatformTopbar } from "@/components/platform/topbar";
import { requireWorkspace } from "@/features/workspace/guards";

export default async function WorkspacePlatformLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  await requireWorkspace();

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
