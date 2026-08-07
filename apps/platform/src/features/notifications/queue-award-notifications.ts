"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  DefaultAwardNotificationApplicationService,
} from "./services";

import {
  resolveOpportunityActionContext,
} from "@/features/opportunity/actions/helpers";

type QueueAwardNotificationsActionResult =
  | {
      success: true;
      data: {
        opportunityId: string;
        queuedCount: number;
        skippedCount: number;
      };
      message: string;
    }
  | {
      success: false;
      message: string;
    };

export async function queueAwardNotificationsAction(
  opportunityId: string,
): Promise<QueueAwardNotificationsActionResult> {
  try {
    const context =
      await resolveOpportunityActionContext();

    const service =
      new DefaultAwardNotificationApplicationService();

    const result =
      await service.queueForOpportunity({
        workspaceId:
          context.workspaceId,
        actorUserId:
          context.actorUserId,
        opportunityId,
      });

    revalidatePath(
      `/platform/opportunities/${opportunityId}/award`,
    );

    revalidatePath("/platform/notifications");

    return {
      success: true,
      data: {
        opportunityId:
          result.opportunityId,
        queuedCount:
          result.queuedCount,
        skippedCount:
          result.skippedCount,
      },
      message:
        result.queuedCount > 0
          ? `تمت جدولة ${result.queuedCount} إشعارًا، وتخطي ${result.skippedCount}.`
          : `لا توجد إشعارات جديدة للجدولة، وتم تخطي ${result.skippedCount}.`,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "تعذر جدولة إشعارات نتيجة المنافسة.",
    };
  }
}
