import type {
  WorkspaceAccessResult,
} from "./workspace-access.types";
import {
  WorkspaceWriteAccessDeniedError,
} from "./workspace-write-access.errors";
import {
  evaluateWorkspaceWriteAccess,
} from "./workspace-write-access.policy";

export function requireWorkspaceWriteAccess(
  access: WorkspaceAccessResult,
) {
  const writeAccess =
    evaluateWorkspaceWriteAccess(access);

  if (
    writeAccess.decision === "DENY_WRITE"
  ) {
    throw new WorkspaceWriteAccessDeniedError(
      writeAccess.reason,
    );
  }

  return writeAccess;
}
