import type {
  WorkspaceAccessResult,
} from "./workspace-access.types";
import type {
  WorkspaceWriteAccessResult,
} from "./workspace-write-access.types";

export function evaluateWorkspaceWriteAccess(
  access: WorkspaceAccessResult,
): WorkspaceWriteAccessResult {
  switch (access.decision) {
    case "ALLOW":
      return {
        decision: "ALLOW_WRITE",
        reason: "WORKSPACE_FULL_ACCESS",
      };

    case "READ_ONLY":
      return {
        decision: "DENY_WRITE",
        reason: "WORKSPACE_READ_ONLY",
      };

    case "RESTRICTED":
      return {
        decision: "DENY_WRITE",
        reason: "WORKSPACE_RESTRICTED",
      };

    case "BLOCKED":
      return {
        decision: "DENY_WRITE",
        reason: "WORKSPACE_BLOCKED",
      };
  }
}
