"use server";

import type {
  OpportunityResponse,
} from "../dtos";

import {
  DefaultOpportunityApplicationService,
} from "../services";

import type {
  GetOpportunityActionInput,
} from "./action-inputs";

import {
  opportunityActionSuccess,
  type OpportunityActionResult,
} from "./action-result";

import {
  mapOpportunityActionError,
  resolveOpportunityActionContext,
} from "./helpers";

export async function getOpportunityAction(
  input: GetOpportunityActionInput,
): Promise<
  OpportunityActionResult<OpportunityResponse>
> {
  try {
    const context =
      await resolveOpportunityActionContext();

    const service =
      new DefaultOpportunityApplicationService();

    const opportunity =
      await service.getById({
        opportunityId: input.opportunityId,
        workspaceId: context.workspaceId,
        actorUserId: context.actorUserId,
      });

    return opportunityActionSuccess(
      opportunity,
    );
  } catch (error) {
    return mapOpportunityActionError(error);
  }
}
