"use server";

import type {
  OpportunityCriterionResponse,
  UpdateOpportunityCriterionRequest,
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
  revalidateOpportunityCriteria,
  resolveOpportunityActionContext,
} from "./helpers";

type UpdateOpportunityCriterionActionInput =
  Omit<
    UpdateOpportunityCriterionRequest,
    "workspaceId" | "actorUserId"
  >;

export async function updateOpportunityCriterionAction(
  input: UpdateOpportunityCriterionActionInput,
): Promise<
  OpportunityActionResult<OpportunityCriterionResponse>
> {
  try {
    const context =
      await resolveOpportunityActionContext();

    const service =
      new DefaultOpportunityCriterionApplicationService();

    const criterion = await service.update({
      ...input,
      workspaceId: context.workspaceId,
      actorUserId: context.actorUserId,
    });

    revalidateOpportunityCriteria(
      criterion.opportunityId,
    );

    return opportunityActionSuccess(
      criterion,
      "تم تحديث معيار التقييم بنجاح.",
    );
  } catch (error) {
    return mapOpportunityActionError(error);
  }
}
