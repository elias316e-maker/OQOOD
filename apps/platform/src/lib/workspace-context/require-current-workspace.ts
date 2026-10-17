import { redirect } from "next/navigation";

import { getCurrentWorkspace } from "./get-current-workspace";

export async function requireCurrentWorkspace() {
  const context = await getCurrentWorkspace();

  if (!context) {
    redirect("/platform/onboarding");
  }

  return context;
}
