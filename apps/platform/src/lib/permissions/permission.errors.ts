import type {
  PermissionCode,
} from "./permission.types";

export class PermissionDeniedError extends Error {
  constructor(
    public readonly permission: PermissionCode,
  ) {
    super(
      `لا يملك المستخدم الصلاحية المطلوبة: ${permission}`,
    );

    this.name = "PermissionDeniedError";
  }
}
