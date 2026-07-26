import {
  WorkspaceAccessDeniedError,
  WorkspaceWriteAccessDeniedError,
} from "@/lib/access";

import {
  PermissionDeniedError,
} from "@/lib/permissions";

import {
  ProcurementAuthorizationError,
  ProcurementConflictError,
  ProcurementNotFoundError,
  ProcurementStateTransitionError,
  ProcurementValidationError,
} from "../../services";

import {
  ProcurementActionContextError,
  ProcurementActionValidationError,
} from "../action-errors";

import {
  procurementActionFailure,
  type ProcurementActionResult,
} from "../action-result";

export function mapProcurementActionError(
  error: unknown,
): ProcurementActionResult<never> {
  if (
    error instanceof
    ProcurementActionValidationError
  ) {
    return procurementActionFailure(
      error.message,
      error.fieldErrors,
    );
  }

  if (error instanceof ProcurementConflictError) {
    return procurementActionFailure(
      error.message,
      {
        number: error.message,
      },
    );
  }

  if (
    error instanceof ProcurementValidationError ||
    error instanceof ProcurementNotFoundError ||
    error instanceof
      ProcurementStateTransitionError ||
    error instanceof
      ProcurementAuthorizationError ||
    error instanceof PermissionDeniedError ||
    error instanceof WorkspaceAccessDeniedError ||
    error instanceof
      WorkspaceWriteAccessDeniedError ||
    error instanceof ProcurementActionContextError
  ) {
    return procurementActionFailure(
      error.message,
    );
  }

  console.error(
    "Unhandled Procurement Server Action error:",
    error,
  );

  return procurementActionFailure(
    "حدث خطأ غير متوقع أثناء تنفيذ العملية. حاول مرة أخرى.",
  );
}

