"use server";

import type {
  DeleteOpportunityCriterionRequest,
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

type DeleteOpportunityCriterionActionInput =
  Omit<
    DeleteOpportunityCriterionRequest,
    "workspaceId" | "actorUserId"
  >;

export async function deleteOpportunityCriterionAction(
  input: DeleteOpportunityCriterionActionInput,
): Promise<
  OpportunityActionResult<{ criterionId: string }>
> {
  try {
    const context =
      await resolveOpportunityActionContext();

    const service =
      new DefaultOpportunityCriterionApplicationService();

    await service.delete({
      ...input,
      workspaceId: context.workspaceId,
      actorUserId: context.actorUserId,
    });

    revalidateOpportunityCriteria(
      input.opportunityId,
    );

    return opportunityActionSuccess(
      {
        criterionId: input.criterionId,
      },
      "تم حذف معيار التقييم بنجاح.",
    );
  } catch (error) {
    return mapOpportunityActionError(error);
  }
}
