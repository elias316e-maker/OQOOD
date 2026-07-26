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

export async function submitProcurementRequestAction(
  input: ProcurementRequestCommandActionInput,
): Promise<
  ProcurementActionResult<ProcurementRequestResponse>
> {
  return await executeLifecycleAction(
    "submit",
    input,
    "تم إرسال طلب المشتريات للمراجعة.",
  );
}

export async function startProcurementReviewAction(
  input: ProcurementRequestCommandActionInput,
): Promise<
  ProcurementActionResult<ProcurementRequestResponse>
> {
  return await executeLifecycleAction(
    "startReview",
    input,
    "بدأت مراجعة طلب المشتريات.",
  );
}

export async function requestProcurementChangesAction(
  input: ProcurementRequestCommandActionInput,
): Promise<
  ProcurementActionResult<ProcurementRequestResponse>
> {
  return await executeLifecycleAction(
    "requestChanges",
    input,
    "تمت إعادة الطلب لإجراء التعديلات.",
    true,
  );
}

export async function approveProcurementRequestAction(
  input: ProcurementRequestCommandActionInput,
): Promise<
  ProcurementActionResult<ProcurementRequestResponse>
> {
  return await executeLifecycleAction(
    "approve",
    input,
    "تم اعتماد طلب المشتريات.",
  );
}

export async function rejectProcurementRequestAction(
  input: ProcurementRequestCommandActionInput,
): Promise<
  ProcurementActionResult<ProcurementRequestResponse>
> {
  return await executeLifecycleAction(
    "reject",
    input,
    "تم رفض طلب المشتريات.",
    true,
  );
}

export async function cancelProcurementRequestAction(
  input: ProcurementRequestCommandActionInput,
): Promise<
  ProcurementActionResult<ProcurementRequestResponse>
> {
  return await executeLifecycleAction(
    "cancel",
    input,
    "تم إلغاء طلب المشتريات.",
  );
}

export async function archiveProcurementRequestAction(
  input: ProcurementRequestCommandActionInput,
): Promise<
  ProcurementActionResult<ProcurementRequestResponse>
> {
  return await executeLifecycleAction(
    "archive",
    input,
    "تمت أرشفة طلب المشتريات.",
  );
}
