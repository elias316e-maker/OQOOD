export type WorkspaceAccessDecision =
  | "ALLOW"
  | "READ_ONLY"
  | "RESTRICTED"
  | "BLOCKED";

export interface WorkspaceAccessResult {
  decision: WorkspaceAccessDecision;
  reason?: string;
}
