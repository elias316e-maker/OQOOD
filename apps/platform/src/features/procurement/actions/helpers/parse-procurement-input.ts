import type {
  z,
} from "zod";

import {
  ProcurementActionValidationError,
} from "../action-errors";

export function parseProcurementInput<T>(
  schema: z.ZodType<T>,
  input: unknown,
): T {
  const result = schema.safeParse(input);

  if (result.success) {
    return result.data;
  }

  const fieldErrors: Record<string, string> = {};

  for (const issue of result.error.issues) {
    const field =
      issue.path.length > 0
        ? issue.path.join(".")
        : "_form";

    fieldErrors[field] ??= issue.message;
  }

  throw new ProcurementActionValidationError(
    fieldErrors,
  );
}

