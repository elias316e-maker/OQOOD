export type ProcurementActionFieldErrors =
  Record<string, string>;

export type ProcurementActionResult<T> =
  | {
      success: true;
      data: T;
      message?: string;
      fieldErrors?: undefined;
    }
  | {
      success: false;
      data?: undefined;
      message: string;
      fieldErrors?: ProcurementActionFieldErrors;
    };

export function procurementActionSuccess<T>(
  data: T,
  message?: string,
): ProcurementActionResult<T> {
  return {
    success: true,
    data,
    ...(message ? { message } : {}),
  };
}

export function procurementActionFailure(
  message: string,
  fieldErrors?: ProcurementActionFieldErrors,
): ProcurementActionResult<never> {
  return {
    success: false,
    message,
    ...(fieldErrors ? { fieldErrors } : {}),
  };
}

