export type WorkspaceWriteAccessDecision =
  | "ALLOW_WRITE"
  | "DENY_WRITE";

export type WorkspaceWriteAccessReason =
  | "WORKSPACE_FULL_ACCESS"
  | "WORKSPACE_READ_ONLY"
  | "WORKSPACE_RESTRICTED"
  | "WORKSPACE_BLOCKED";

export interface WorkspaceWriteAccessResult {
  decision: WorkspaceWriteAccessDecision;
  reason: WorkspaceWriteAccessReason;
}
