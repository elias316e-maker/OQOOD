"use server";

import type {
  OpportunityResponse,
} from "../dtos";

import {
  DefaultOpportunityApplicationService,
} from "../services";

import type {
  CreateOpportunityActionInput,
} from "./action-inputs";

import {
  opportunityActionSuccess,
  type OpportunityActionResult,
} from "./action-result";

import {
  mapOpportunityActionError,
  resolveOpportunityActionContext,
  revalidateOpportunityCollection,
} from "./helpers";

export async function createOpportunityAction(
  input: CreateOpportunityActionInput,
): Promise<
  OpportunityActionResult<OpportunityResponse>
> {
  try {
    const context =
      await resolveOpportunityActionContext();

    const service =
      new DefaultOpportunityApplicationService();

    const opportunity = await service.create({
      ...input,
      workspaceId: context.workspaceId,
      actorUserId: context.actorUserId,
    });

    revalidateOpportunityCollection();

    return opportunityActionSuccess(
      opportunity,
      "تم إنشاء الفرصة بنجاح.",
    );
  } catch (error) {
    return mapOpportunityActionError(error);
  }
}
