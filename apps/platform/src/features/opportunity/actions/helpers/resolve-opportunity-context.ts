import {
  requireAuthenticatedUser,
} from "@/features/workspace/guards";

import {
  requireCurrentWorkspace,
} from "@/lib/workspace-context";

import {
  OpportunityActionContextError,
} from "../action-errors";

export type OpportunityActionContext = {
  actorUserId: string;
  workspaceId: string;
};

export async function resolveOpportunityActionContext():
  Promise<OpportunityActionContext> {
  const [user, workspaceContext] =
    await Promise.all([
      requireAuthenticatedUser(),
      requireCurrentWorkspace(),
    ]);

  const actorUserId = user.id.trim();
  const workspaceId =
    workspaceContext.workspace.id.trim();

  if (!actorUserId || !workspaceId) {
    throw new OpportunityActionContextError();
  }

  return {
    actorUserId,
    workspaceId,
  };
}
