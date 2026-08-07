"use server";

import {
  revalidatePath,
} from "next/cache";

import type {
  OfferEvaluationResponse,
  SaveOfferCriterionScoreRequest,
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

type SaveOfferCriterionScoreActionInput =
  Omit<
    SaveOfferCriterionScoreRequest,
    "workspaceId" | "actorUserId"
  >;

export async function saveOfferCriterionScoreAction(
  input: SaveOfferCriterionScoreActionInput,
): Promise<
  OpportunityActionResult<OfferEvaluationResponse>
> {
  try {
    const context =
      await resolveOpportunityActionContext();

    const service =
      new DefaultOfferEvaluationApplicationService();

    const evaluation = await service.saveScore({
      ...input,
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
      "تم حفظ درجة المعيار بنجاح.",
    );
  } catch (error) {
    return mapOpportunityActionError(error);
  }
}
