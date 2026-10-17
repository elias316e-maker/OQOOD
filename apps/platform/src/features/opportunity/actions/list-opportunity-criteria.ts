"use server";

import type {
  OpportunityCriteriaListResponse,
} from "../dtos";

import {
  DefaultOpportunityCriterionApplicationService,
} from "../services";

import {
  opportunityActionSuccess,
  type OpportunityActionResult,
} from "./action-result";

import {
  mapOpportunityActionError,
  resolveOpportunityActionContext,
} from "./helpers";

export async function listOpportunityCriteriaAction(
  opportunityId: string,
): Promise<
  OpportunityActionResult<OpportunityCriteriaListResponse>
> {
  try {
    const context =
      await resolveOpportunityActionContext();

    const service =
      new DefaultOpportunityCriterionApplicationService();

    const result = await service.list({
      opportunityId,
      workspaceId: context.workspaceId,
      actorUserId: context.actorUserId,
    });

    return opportunityActionSuccess(result);
  } catch (error) {
    return mapOpportunityActionError(error);
  }
}
