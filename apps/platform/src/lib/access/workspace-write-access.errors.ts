import type {
  WorkspaceWriteAccessReason,
} from "./workspace-write-access.types";

export class WorkspaceWriteAccessDeniedError
  extends Error
{
  constructor(
    public readonly reason: WorkspaceWriteAccessReason,
  ) {
    super(
      "لا تسمح حالة مساحة العمل الحالية بإنشاء البيانات أو تعديلها.",
    );

    this.name =
      "WorkspaceWriteAccessDeniedError";
  }
}
