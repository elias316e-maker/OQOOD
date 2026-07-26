"use server";

import type {
  ProcurementRequestListResponse,
} from "../dtos";

import {
  listProcurementRequestsSchema,
} from "../validators";

import type {
  ListProcurementRequestsActionInput,
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

export async function listProcurementRequestsAction(
  input: ListProcurementRequestsActionInput = {},
): Promise<
  ProcurementActionResult<ProcurementRequestListResponse>
> {
  try {
    const context =
      await resolveProcurementActionContext();
    const request = parseProcurementInput(
      listProcurementRequestsSchema,
      {
        ...input,
        ...context,
      },
    );

    const result =
      await createProcurementService().list(
        request,
      );

    return procurementActionSuccess(result);
  } catch (error) {
    return mapProcurementActionError(error);
  }
}

