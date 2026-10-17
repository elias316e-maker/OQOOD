import { redirect } from "next/navigation";

import {
  findCurrentWorkspaceForUser,
} from "@/lib/workspace-context";

import { requireAuthenticatedUser } from "./require-authenticated-user";

export async function requireWorkspaceOnboarding() {
  const user = await requireAuthenticatedUser();

  const workspace =
    await findCurrentWorkspaceForUser(user.id);

  if (workspace) {
    redirect("/platform");
  }

  return user;
}
