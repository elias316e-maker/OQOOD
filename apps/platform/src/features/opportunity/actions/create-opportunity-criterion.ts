"use server";

import type {
  CreateOpportunityCriterionRequest,
  OpportunityCriterionResponse,
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

type CreateOpportunityCriterionActionInput =
  Omit<
    CreateOpportunityCriterionRequest,
    "workspaceId" | "actorUserId"
  >;

export async function createOpportunityCriterionAction(
  input: CreateOpportunityCriterionActionInput,
): Promise<
  OpportunityActionResult<OpportunityCriterionResponse>
> {
  try {
    const context =
      await resolveOpportunityActionContext();

    const service =
      new DefaultOpportunityCriterionApplicationService();

    const criterion = await service.create({
      ...input,
      workspaceId: context.workspaceId,
      actorUserId: context.actorUserId,
    });

    revalidateOpportunityCriteria(
      criterion.opportunityId,
    );

    return opportunityActionSuccess(
      criterion,
      "تم إنشاء معيار التقييم بنجاح.",
    );
  } catch (error) {
    return mapOpportunityActionError(error);
  }
}
