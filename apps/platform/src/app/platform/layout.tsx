import type { ReactNode } from "react";
import { Sidebar } from "@/components/platform/sidebar";
import { PlatformTopbar } from "@/components/platform/topbar";

export default function PlatformLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="platformShell">
      <Sidebar />

      <div className="platformMain">
        <PlatformTopbar />
        {children}
      </div>
    </div>
  );
}
