"use server";

import {
  revalidatePath,
} from "next/cache";

import type {
  OfferEvaluationResponse,
} from "../dtos";

import {
  DefaultOfferEvaluationApplicationService,
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

export async function completeOfferEvaluationAction(
  offerId: string,
): Promise<
  OpportunityActionResult<OfferEvaluationResponse>
> {
  try {
    const context =
      await resolveOpportunityActionContext();

    const service =
      new DefaultOfferEvaluationApplicationService();

    const evaluation = await service.complete({
      offerId,
      workspaceId: context.workspaceId,
      actorUserId: context.actorUserId,
    });

    const opportunityPath =
      `/platform/opportunities/${evaluation.offer.opportunityId}`;

    revalidatePath(opportunityPath);
    revalidatePath(`${opportunityPath}/evaluation`);
    revalidatePath(`${opportunityPath}/offers`);

    return opportunityActionSuccess(
      evaluation,
      evaluation.summary.passed
        ? "تم اعتماد العرض فنيًا."
        : "اكتمل التقييم ولم يجتز العرض المتطلبات الإلزامية.",
    );
  } catch (error) {
    return mapOpportunityActionError(error);
  }
}
