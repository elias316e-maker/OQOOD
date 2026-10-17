"use server";

import type {
  OfferEvaluationResponse,
} from "../dtos";

import {
  DefaultOfferEvaluationApplicationService,
} from "../services";

import {
  opportunityActionSuccess,
  type OpportunityActionResult,
} from "./action-result";

import {
  mapOpportunityActionError,
} from "./helpers/map-opportunity-action-error";

import {
  resolveOpportunityActionContext,
} from "./helpers/resolve-opportunity-context";

export async function getOfferEvaluationAction(
  offerId: string,
): Promise<
  OpportunityActionResult<OfferEvaluationResponse>
> {
  try {
    const context =
      await resolveOpportunityActionContext();

    const service =
      new DefaultOfferEvaluationApplicationService();

    const evaluation = await service.get({
      offerId,
      workspaceId: context.workspaceId,
      actorUserId: context.actorUserId,
    });

    return opportunityActionSuccess(evaluation);
  } catch (error) {
    return mapOpportunityActionError(error);
  }
}
