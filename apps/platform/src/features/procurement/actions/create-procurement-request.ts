"use server";

import type {
  ProcurementRequestResponse,
} from "../dtos";

import {
  createProcurementRequestSchema,
} from "../validators";

import type {
  CreateProcurementRequestActionInput,
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
  revalidateProcurementCollection,
} from "./helpers";

export async function createProcurementRequestAction(
  input: CreateProcurementRequestActionInput,
): Promise<
  ProcurementActionResult<ProcurementRequestResponse>
> {
  try {
    const context =
      await resolveProcurementActionContext();
    const request = parseProcurementInput(
      createProcurementRequestSchema,
      {
        ...input,
        ...context,
      },
    );

    const procurementRequest =
      await createProcurementService().create(
        request,
      );

    revalidateProcurementCollection();

    return procurementActionSuccess(
      procurementRequest,
      "تم إنشاء طلب المشتريات بنجاح.",
    );
  } catch (error) {
    return mapProcurementActionError(error);
  }
}

