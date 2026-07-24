import type {
  WorkspaceAccessDecision,
} from "./workspace-access.types";

export class WorkspaceAccessDeniedError extends Error {
  constructor(
    public readonly decision: Exclude<
      WorkspaceAccessDecision,
      "ALLOW"
    >,
    public readonly reason: string,
  ) {
    super("لا تسمح حالة مساحة العمل الحالية بهذا الإجراء.");
    this.name = "WorkspaceAccessDeniedError";
  }
}
