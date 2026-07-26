import {
  requireAuthenticatedUser,
} from "@/features/workspace/guards";

import {
  requireCurrentWorkspace,
} from "@/lib/workspace-context";

import {
  ProcurementActionContextError,
} from "../action-errors";

export type ProcurementActionContext = {
  actorUserId: string;
  workspaceId: string;
};

export async function resolveProcurementActionContext():
  Promise<ProcurementActionContext> {
  const [user, workspaceContext] =
    await Promise.all([
      requireAuthenticatedUser(),
      requireCurrentWorkspace(),
    ]);

  const actorUserId = user.id.trim();
  const workspaceId =
    workspaceContext.workspace.id.trim();

  if (!actorUserId || !workspaceId) {
    throw new ProcurementActionContextError();
  }

  return {
    actorUserId,
    workspaceId,
  };
}

