"use server";

import {
  revalidatePath,
} from "next/cache";

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

export async function completeFinancialEvaluationAction(
  opportunityId: string,
): Promise<
  OpportunityActionResult<FinancialEvaluationResponse>
> {
  try {
    const context =
      await resolveOpportunityActionContext();

    const service =
      new DefaultFinancialEvaluationApplicationService();

    const evaluation = await service.complete({
      opportunityId,
      workspaceId: context.workspaceId,
      actorUserId: context.actorUserId,
    });

    const opportunityPath =
      `/platform/opportunities/${opportunityId}`;

    revalidatePath(opportunityPath);
    revalidatePath(`${opportunityPath}/evaluation`);
    revalidatePath(`${opportunityPath}/offers`);
    revalidatePath(`${opportunityPath}/award`);

    return opportunityActionSuccess(
      evaluation,
      "تم إكمال التقييم المالي بنجاح.",
    );
  } catch (error) {
    return mapOpportunityActionError(error);
  }
}
