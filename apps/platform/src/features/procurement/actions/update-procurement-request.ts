"use server";

import type {
  ProcurementRequestResponse,
} from "../dtos";

import {
  updateProcurementRequestSchema,
} from "../validators";

import type {
  UpdateProcurementRequestActionInput,
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

export async function updateProcurementRequestAction(
  input: UpdateProcurementRequestActionInput,
): Promise<
  ProcurementActionResult<ProcurementRequestResponse>
> {
  try {
    const context =
      await resolveProcurementActionContext();
    const request = parseProcurementInput(
      updateProcurementRequestSchema,
      {
        ...input,
        ...context,
      },
    );

    const procurementRequest =
      await createProcurementService().update(
        request,
      );

    revalidateProcurementDetails(
      procurementRequest.id,
    );

    return procurementActionSuccess(
      procurementRequest,
      "تم تحديث طلب المشتريات بنجاح.",
    );
  } catch (error) {
    return mapProcurementActionError(error);
  }
}

