import {
  WorkspaceAccessDeniedError,
  WorkspaceWriteAccessDeniedError,
} from "@/lib/access";

import {
  PermissionDeniedError,
} from "@/lib/permissions";

import {
  OpportunityActionContextError,
} from "../action-errors";

import {
  OpportunityArchivedError,
  OpportunityCriteriaWeightExceededError,
  OpportunityCriterionDuplicateNameError,
  OpportunityCriterionImmutableError,
  OpportunityCriterionNotFoundError,
  OpportunityInvalidStatusTransitionError,
  OpportunityNotFoundError,
  OpportunityNumberAlreadyExistsError,
  OpportunityPublishRequirementsError,
  OpportunityUpdateFieldsRequiredError,
  OpportunityValidationError,
} from "../../errors";

import {
  opportunityActionFailure,
  type OpportunityActionFailure,
  type OpportunityActionFieldErrors,
} from "../action-result";

function normalizeFieldErrors(
  value: unknown,
): OpportunityActionFieldErrors | undefined {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return undefined;
  }

  const source =
    "fieldErrors" in value &&
    typeof value.fieldErrors === "object" &&
    value.fieldErrors !== null
      ? value.fieldErrors
      : value;

  const result: OpportunityActionFieldErrors = {};

  for (
    const [field, messages] of
    Object.entries(source)
  ) {
    if (typeof messages === "string") {
      result[field] = messages;
      continue;
    }

    if (Array.isArray(messages)) {
      const message = messages.find(
        (item): item is string =>
          typeof item === "string",
      );

      if (message) {
        result[field] = message;
      }
    }
  }

  return Object.keys(result).length > 0
    ? result
    : undefined;
}

export function mapOpportunityActionError(
  error: unknown,
): OpportunityActionFailure {
  if (
    error instanceof
    OpportunityValidationError
  ) {
    return opportunityActionFailure(
      error.message,
      normalizeFieldErrors(
        error.validationErrors,
      ),
    );
  }

  if (
    error instanceof
    OpportunityNumberAlreadyExistsError
  ) {
    return opportunityActionFailure(
      error.message,
      {
        number: error.message,
      },
    );
  }

  if (
    error instanceof OpportunityNotFoundError ||
    error instanceof
      OpportunityUpdateFieldsRequiredError ||
    error instanceof OpportunityArchivedError ||
    error instanceof
      OpportunityCriterionNotFoundError ||
    error instanceof
      OpportunityCriterionDuplicateNameError ||
    error instanceof
      OpportunityCriteriaWeightExceededError ||
    error instanceof
      OpportunityCriterionImmutableError ||
    error instanceof
      OpportunityInvalidStatusTransitionError ||
    error instanceof
      OpportunityPublishRequirementsError ||
    error instanceof PermissionDeniedError ||
    error instanceof
      WorkspaceAccessDeniedError ||
    error instanceof
      WorkspaceWriteAccessDeniedError ||
    error instanceof
      OpportunityActionContextError
  ) {
    return opportunityActionFailure(
      error.message,
    );
  }

  console.error(
    "Unhandled Opportunity Server Action error:",
    error,
  );

  return opportunityActionFailure(
    "حدث خطأ غير متوقع أثناء تنفيذ العملية. حاول مرة أخرى.",
  );
}
