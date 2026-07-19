import { redirect } from "next/navigation";

import { requireAuthenticatedUser } from "./require-authenticated-user";
import { resolveUserWorkspace } from "./resolve-user-workspace";

export async function requireWorkspaceOnboarding() {
  const user = await requireAuthenticatedUser();
  const membership = await resolveUserWorkspace(user.id);

  if (membership) {
    redirect("/platform");
  }

  return user;
}
