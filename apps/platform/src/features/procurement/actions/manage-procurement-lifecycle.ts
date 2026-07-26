"use server";

import type {
  ProcurementRequestResponse,
} from "../dtos";

import {
  procurementRequestCommandSchema,
  procurementRequestReasonCommandSchema,
} from "../validators";

import type {
  ProcurementRequestCommandActionInput,
} from "./action-inputs";

import {
  procurementActionSuccess,
  type ProcurementActionResult,
} from "./action-result";

import {
  createProcurementService,
  mapProcurementActionError,
  parseProcurementInput,
  resolveProcurementActionContext,
  revalidateProcurementDetails,
} from "./helpers";

type LifecycleMethod =
  | "submit"
  | "startReview"
  | "requestChanges"
  | "approve"
  | "reject"
  | "cancel"
  | "archive";

async function executeLifecycleAction(
  method: LifecycleMethod,
  input: ProcurementRequestCommandActionInput,
  message: string,
  reasonRequired = false,
): Promise<
  ProcurementActionResult<ProcurementRequestResponse>
> {
  try {
    const context =
      await resolveProcurementActionContext();
    const request = parseProcurementInput(
      reasonRequired
        ? procurementRequestReasonCommandSchema
        : procurementRequestCommandSchema,
      {
        ...input,
        ...context,
      },
    );

    const service = createProcurementService();
    const procurementRequest =
      await service[method](request);

    revalidateProcurementDetails(
      procurementRequest.id,
    );

    return procurementActionSuccess(
      procurementRequest,
      message,
    );
  } catch (error) {
    return mapProcurementActionError(error);
  }
}

export function submitProcurementRequestAction(
  input: ProcurementRequestCommandActionInput,
): Promise<
  ProcurementActionResult<ProcurementRequestResponse>
> {
  return executeLifecycleAction(
    "submit",
    input,
    "تم إرسال طلب المشتريات للمراجعة.",
  );
}

export function startProcurementReviewAction(
  input: ProcurementRequestCommandActionInput,
): Promise<
  ProcurementActionResult<ProcurementRequestResponse>
> {
  return executeLifecycleAction(
    "startReview",
    input,
    "بدأت مراجعة طلب المشتريات.",
  );
}

export function requestProcurementChangesAction(
  input: ProcurementRequestCommandActionInput,
): Promise<
  ProcurementActionResult<ProcurementRequestResponse>
> {
  return executeLifecycleAction(
    "requestChanges",
    input,
    "تمت إعادة الطلب لإجراء التعديلات.",
    true,
  );
}

export function approveProcurementRequestAction(
  input: ProcurementRequestCommandActionInput,
): Promise<
  ProcurementActionResult<ProcurementRequestResponse>
> {
  return executeLifecycleAction(
    "approve",
    input,
    "تم اعتماد طلب المشتريات.",
  );
}

export function rejectProcurementRequestAction(
  input: ProcurementRequestCommandActionInput,
): Promise<
  ProcurementActionResult<ProcurementRequestResponse>
> {
  return executeLifecycleAction(
    "reject",
    input,
    "تم رفض طلب المشتريات.",
    true,
  );
}

export function cancelProcurementRequestAction(
  input: ProcurementRequestCommandActionInput,
): Promise<
  ProcurementActionResult<ProcurementRequestResponse>
> {
  return executeLifecycleAction(
    "cancel",
    input,
    "تم إلغاء طلب المشتريات.",
  );
}

export function archiveProcurementRequestAction(
  input: ProcurementRequestCommandActionInput,
): Promise<
  ProcurementActionResult<ProcurementRequestResponse>
> {
  return executeLifecycleAction(
    "archive",
    input,
    "تمت أرشفة طلب المشتريات.",
  );
}

