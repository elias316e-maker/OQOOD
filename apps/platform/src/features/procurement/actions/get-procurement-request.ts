"use server";

import type {
  ProcurementRequestResponse,
} from "../dtos";

import {
  getProcurementRequestSchema,
} from "../validators";

import type {
  GetProcurementRequestActionInput,
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
} from "./helpers";

export async function getProcurementRequestAction(
  input: GetProcurementRequestActionInput,
): Promise<
  ProcurementActionResult<ProcurementRequestResponse>
> {
  try {
    const context =
      await resolveProcurementActionContext();
    const request = parseProcurementInput(
      getProcurementRequestSchema,
      {
        ...input,
        ...context,
      },
    );

    const procurementRequest =
      await createProcurementService().getById(
        request,
      );

    return procurementActionSuccess(
      procurementRequest,
    );
  } catch (error) {
    return mapProcurementActionError(error);
  }
}

