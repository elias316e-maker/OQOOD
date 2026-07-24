export class ProcurementValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name =
      "ProcurementValidationError";
  }
}

export class ProcurementNotFoundError extends Error {
  constructor(message = "طلب الشراء غير موجود.") {
    super(message);
    this.name =
      "ProcurementNotFoundError";
  }
}

export class ProcurementConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name =
      "ProcurementConflictError";
  }
}

export class ProcurementStateTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name =
      "ProcurementStateTransitionError";
  }
}

export class ProcurementAuthorizationError extends Error {
  constructor(message = "ليست لديك صلاحية لتنفيذ هذا الإجراء.") {
    super(message);
    this.name =
      "ProcurementAuthorizationError";
  }
}
