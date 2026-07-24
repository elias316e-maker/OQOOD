import type {
  CurrentWorkspaceContext,
} from "@/lib/workspace-context";

import {
  WorkspaceAccessDeniedError,
} from "./workspace-access.errors";
import {
  evaluateWorkspaceAccess,
} from "./workspace-access.policy";

export function requireWorkspaceAccess(
  context: CurrentWorkspaceContext,
) {
  const access = evaluateWorkspaceAccess(context);

  if (access.decision === "BLOCKED") {
    throw new WorkspaceAccessDeniedError(
      access.decision,
      access.reason ?? "WORKSPACE_ACCESS_BLOCKED",
    );
  }

  return {
    context,
    access,
  };
}
