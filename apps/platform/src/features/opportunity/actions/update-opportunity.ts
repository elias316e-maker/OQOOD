"use server";

import type {
  OpportunityResponse,
} from "../dtos";

import {
  DefaultOpportunityApplicationService,
} from "../services";

import type {
  UpdateOpportunityActionInput,
} from "./action-inputs";

import {
  opportunityActionSuccess,
  type OpportunityActionResult,
} from "./action-result";

import {
  mapOpportunityActionError,
  revalidateOpportunityCollection,
  revalidateOpportunityDetails,
  resolveOpportunityActionContext,
} from "./helpers";

export async function updateOpportunityAction(
  input: UpdateOpportunityActionInput,
): Promise<
  OpportunityActionResult<OpportunityResponse>
> {
  try {
    const context =
      await resolveOpportunityActionContext();

    const service =
      new DefaultOpportunityApplicationService();

    const opportunity =
      await service.update({
        ...input,
        workspaceId: context.workspaceId,
        actorUserId: context.actorUserId,
      });

    revalidateOpportunityCollection();
    revalidateOpportunityDetails(
      opportunity.id,
    );

    return opportunityActionSuccess(
      opportunity,
      "تم تحديث الفرصة بنجاح.",
    );
  } catch (error) {
    return mapOpportunityActionError(error);
  }
}
