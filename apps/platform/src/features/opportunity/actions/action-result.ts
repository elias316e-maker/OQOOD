export type OpportunityActionFieldErrors =
  Record<string, string>;

export type OpportunityActionSuccess<T> = {
  success: true;
  data: T;
  message?: string;
  fieldErrors?: undefined;
};

export type OpportunityActionFailure = {
  success: false;
  data?: undefined;
  message: string;
  fieldErrors?: OpportunityActionFieldErrors;
};

export type OpportunityActionResult<T> =
  | OpportunityActionSuccess<T>
  | OpportunityActionFailure;

export function opportunityActionSuccess<T>(
  data: T,
  message?: string,
): OpportunityActionSuccess<T> {
  return {
    success: true,
    data,
    ...(message ? { message } : {}),
  };
}

export function opportunityActionFailure(
  message: string,
  fieldErrors?: OpportunityActionFieldErrors,
): OpportunityActionFailure {
  return {
    success: false,
    message,
    ...(fieldErrors ? { fieldErrors } : {}),
  };
}
