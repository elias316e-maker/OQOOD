"use server";

import {
  revalidatePath,
} from "next/cache";

import type {
  AwardRecommendationResponse,
} from "../dtos";

import {
  DefaultAwardNotificationApplicationService,
} from "@/features/notifications/services";

import {
  DefaultAwardRecommendationApplicationService,
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

export type AwardOpportunityActionInput = {
  opportunityId: string;
  offerId: string;
  justification?: string | null;
};

export async function awardOpportunityAction(
  input: AwardOpportunityActionInput,
): Promise<
  OpportunityActionResult<AwardRecommendationResponse>
> {
  try {
    const context =
      await resolveOpportunityActionContext();

    const service =
      new DefaultAwardRecommendationApplicationService();

    const result = await service.recommend({
      opportunityId: input.opportunityId,
      offerId: input.offerId,
      justification:
        input.justification?.trim() || null,
      workspaceId: context.workspaceId,
      actorUserId: context.actorUserId,
    });

    let notificationMessage =
      "تم اعتماد الترسية، لكن لم تتم محاولة جدولة الإشعارات.";

    try {
      const notificationService =
        new DefaultAwardNotificationApplicationService();

      const notificationResult =
        await notificationService.queueForOpportunity({
          workspaceId: context.workspaceId,
          actorUserId: context.actorUserId,
          opportunityId: input.opportunityId,
        });

      notificationMessage =
        notificationResult.queuedCount > 0
          ? `تمت جدولة ${notificationResult.queuedCount} إشعارًا، وتخطي ${notificationResult.skippedCount}.`
          : `لا توجد إشعارات جديدة، وتم تخطي ${notificationResult.skippedCount}.`;
    } catch {
      notificationMessage =
        "تم اعتماد الترسية، وتعذر جدولة إشعارات الموردين. يمكن إعادة المحاولة من صفحة الترسية.";
    }

    const opportunityPath =
      `/platform/opportunities/${input.opportunityId}`;

    revalidatePath(opportunityPath);
    revalidatePath(`${opportunityPath}/offers`);
    revalidatePath(`${opportunityPath}/evaluation`);
    revalidatePath(`${opportunityPath}/award`);
    revalidatePath("/platform/opportunities");
    revalidatePath("/platform/contracts");

    return opportunityActionSuccess(
      result,
      `تم اعتماد العرض الفائز وترسية المنافسة بنجاح. ${notificationMessage}`,
    );
  } catch (error) {
    return mapOpportunityActionError(error);
  }
}
