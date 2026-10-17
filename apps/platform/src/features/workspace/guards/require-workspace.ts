import { redirect } from "next/navigation";

import {
  requireWorkspaceAccess,
  type WorkspaceAccessResult,
} from "@/lib/access";
import {
  findCurrentWorkspaceForUser,
  type CurrentWorkspaceContext,
} from "@/lib/workspace-context";

import {
  requireAuthenticatedUser,
} from "./require-authenticated-user";

export type RequiredWorkspaceContext = {
  user: Awaited<
    ReturnType<typeof requireAuthenticatedUser>
  >;
  membership: CurrentWorkspaceContext;
  workspace: CurrentWorkspaceContext["workspace"];
  access: WorkspaceAccessResult;
};

export async function requireWorkspace():
  Promise<RequiredWorkspaceContext> {
  const user = await requireAuthenticatedUser();

  const membership =
    await findCurrentWorkspaceForUser(user.id);

  if (!membership) {
    redirect("/platform/onboarding");
  }

  const { access } =
    requireWorkspaceAccess(membership);

  return {
    user,
    membership,
    workspace: membership.workspace,
    access,
  };
}
