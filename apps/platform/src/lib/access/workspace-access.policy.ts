import type { CurrentWorkspaceContext } from "@/lib/workspace-context";

import type {
  WorkspaceAccessResult,
} from "./workspace-access.types";

export function evaluateWorkspaceAccess(
  context: CurrentWorkspaceContext,
): WorkspaceAccessResult {
  const { workspace } = context;
  const subscription = workspace.subscription;

  if (workspace.status !== "ACTIVE") {
    return {
      decision: "BLOCKED",
      reason: "WORKSPACE_INACTIVE",
    };
  }

  if (!subscription) {
    return {
      decision: "BLOCKED",
      reason: "SUBSCRIPTION_MISSING",
    };
  }

  switch (subscription.accessState) {
    case "FULL":
      return {
        decision: "ALLOW",
      };

    case "READ_ONLY":
      return {
        decision: "READ_ONLY",
        reason: "SUBSCRIPTION_READ_ONLY",
      };

    case "RESTRICTED":
      return {
        decision: "RESTRICTED",
        reason: "SUBSCRIPTION_RESTRICTED",
      };

    case "BLOCKED":
      return {
        decision: "BLOCKED",
        reason: "SUBSCRIPTION_BLOCKED",
      };

    default: {
      const exhaustiveCheck: never =
        subscription.accessState;

      return {
        decision: "BLOCKED",
        reason: `UNKNOWN_ACCESS_STATE:${exhaustiveCheck}`,
      };
    }
  }
}
