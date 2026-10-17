import { getCurrentUser } from "@/lib/session";

import {
  PrismaCurrentWorkspaceRepository,
  type CurrentWorkspaceRepository,
} from "./current-workspace.repository";

export async function findCurrentWorkspaceForUser(
  userId: string,
  repository: CurrentWorkspaceRepository =
    new PrismaCurrentWorkspaceRepository(),
) {
  const normalizedUserId = userId.trim();

  if (!normalizedUserId) {
    return null;
  }

  return repository.findForUser(normalizedUserId);
}

export async function getCurrentWorkspace(
  repository: CurrentWorkspaceRepository =
    new PrismaCurrentWorkspaceRepository(),
) {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return findCurrentWorkspaceForUser(
    user.id,
    repository,
  );
}
