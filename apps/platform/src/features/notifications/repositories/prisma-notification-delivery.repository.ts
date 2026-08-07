import { prisma } from "@/lib/prisma";

import type {
  MarkNotificationDeliveryFailedInput,
  MarkNotificationDeliveryPendingInput,
  MarkNotificationDeliverySentInput,
  NotificationDeliveryRecord,
  NotificationDeliveryRepository,
} from "./notification-delivery.repository";

export class PrismaNotificationDeliveryRepository
  implements NotificationDeliveryRepository
{
  async findById(
    deliveryId: string,
  ): Promise<NotificationDeliveryRecord | null> {
    return prisma.notificationDelivery.findUnique({
      where: { id: deliveryId },
      select: {
        id: true,
        channel: true,
        recipient: true,
        subject: true,
        body: true,
        href: true,
        status: true,
      },
    });
  }

  async markPending(
    input: MarkNotificationDeliveryPendingInput,
  ): Promise<void> {
    await prisma.notificationDelivery.update({
      where: { id: input.deliveryId },
      data: {
        status: "PENDING",
        lastError: input.error,
      },
    });
  }

  async markSent(
    input: MarkNotificationDeliverySentInput,
  ): Promise<void> {
    await prisma.notificationDelivery.update({
      where: { id: input.deliveryId },
      data: {
        status: "SENT",
        attempts: {
          increment: 1,
        },
        providerId: input.providerId,
        lastError: null,
        sentAt: input.sentAt,
      },
    });
  }

  async markFailed(
    input: MarkNotificationDeliveryFailedInput,
  ): Promise<void> {
    await prisma.notificationDelivery.update({
      where: { id: input.deliveryId },
      data: {
        status: "FAILED",
        attempts: {
          increment: 1,
        },
        lastError: input.error,
      },
    });
  }
}
