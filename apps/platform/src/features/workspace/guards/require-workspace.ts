import { redirect } from "next/navigation";

import { requireAuthenticatedUser } from "./require-authenticated-user";
import {
  resolveUserWorkspace,
  type ResolvedUserWorkspace,
} from "./resolve-user-workspace";

export type WorkspaceContext = {
  user: {
    id: string;
    name: string;
    email: string;
  };
  membership: ResolvedUserWorkspace;
  workspace: ResolvedUserWorkspace["workspace"];
  subscription:
    ResolvedUserWorkspace["workspace"]["subscription"];
};

export async function requireWorkspace():
  Promise<WorkspaceContext> {
  const user = await requireAuthenticatedUser();
  const membership = await resolveUserWorkspace(user.id);

  if (!membership) {
    redirect("/platform/onboarding");
  }

  return {
    user,
    membership,
    workspace: membership.workspace,
    subscription: membership.workspace.subscription,
  };
}
