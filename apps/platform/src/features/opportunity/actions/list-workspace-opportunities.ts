"use server";

import type {
  OpportunityListResponse,
} from "../dtos";

import {
  DefaultOpportunityApplicationService,
} from "../services";

import type {
  ListWorkspaceOpportunitiesActionInput,
} from "./action-inputs";

import {
  opportunityActionSuccess,
  type OpportunityActionResult,
} from "./action-result";

import {
  mapOpportunityActionError,
  resolveOpportunityActionContext,
} from "./helpers";

export async function listWorkspaceOpportunitiesAction(
  input: ListWorkspaceOpportunitiesActionInput = {},
): Promise<
  OpportunityActionResult<OpportunityListResponse>
> {
  try {
    const context =
      await resolveOpportunityActionContext();

    const service =
      new DefaultOpportunityApplicationService();

    const opportunities = await service.list({
      ...input,
      workspaceId: context.workspaceId,
      actorUserId: context.actorUserId,
    });

    return opportunityActionSuccess(
      opportunities,
    );
  } catch (error) {
    return mapOpportunityActionError(error);
  }
}
