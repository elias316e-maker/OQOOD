"use server";

import type {
  FinancialEvaluationResponse,
} from "../dtos";

import {
  DefaultFinancialEvaluationApplicationService,
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

export async function getFinancialEvaluationAction(
  opportunityId: string,
): Promise<
  OpportunityActionResult<FinancialEvaluationResponse>
> {
  try {
    const context =
      await resolveOpportunityActionContext();

    const service =
      new DefaultFinancialEvaluationApplicationService();

    const evaluation = await service.get({
      opportunityId,
      workspaceId: context.workspaceId,
      actorUserId: context.actorUserId,
    });

    return opportunityActionSuccess(evaluation);
  } catch (error) {
    return mapOpportunityActionError(error);
  }
}
