"use server";

import type {
  OpportunityResponse,
} from "../dtos";

import {
  DefaultOpportunityApplicationService,
} from "../services";

import type {
  ArchiveOpportunityActionInput,
} from "./action-inputs";

import {
  opportunityActionSuccess,
  type OpportunityActionResult,
} from "./action-result";

import {
  mapOpportunityActionError,
  revalidateOpportunityDetails,
  resolveOpportunityActionContext,
} from "./helpers";

export async function archiveOpportunityAction(
  input: ArchiveOpportunityActionInput,
): Promise<
  OpportunityActionResult<OpportunityResponse>
> {
  try {
    const context =
      await resolveOpportunityActionContext();

    const service =
      new DefaultOpportunityApplicationService();

    const opportunity =
      await service.archive({
        ...input,
        workspaceId: context.workspaceId,
        actorUserId: context.actorUserId,
      });

    revalidateOpportunityDetails(
      opportunity.id,
    );

    return opportunityActionSuccess(
      opportunity,
      "تمت أرشفة الفرصة بنجاح.",
    );
  } catch (error) {
    return mapOpportunityActionError(error);
  }
}
