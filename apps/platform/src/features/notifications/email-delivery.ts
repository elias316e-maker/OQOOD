import "server-only";

import { prisma } from "@/lib/prisma";

import {
  ResendNotificationEmailProvider,
} from "./providers";

import {
  PrismaNotificationDeliveryRepository,
} from "./repositories";

import {
  DefaultNotificationDeliveryApplicationService,
} from "./services";

type QueueEmailInput = {
  workspaceId: string;
  userId?: string;
  category: string;
  recipient: string;
  subject: string;
  body: string;
  href?: string;
};

function createDeliveryService() {
  return new DefaultNotificationDeliveryApplicationService(
    new PrismaNotificationDeliveryRepository(),
    new ResendNotificationEmailProvider(),
  );
}

export async function queueNotificationEmail(
  input: QueueEmailInput,
) {
  const delivery =
    await prisma.notificationDelivery.create({
      data: {
        ...input,
        channel: "EMAIL",
      },
    });

  await attemptEmailDelivery(delivery.id);

  return delivery;
}

export async function attemptEmailDelivery(
  deliveryId: string,
) {
  const service =
    createDeliveryService();

  await service.deliver({
    deliveryId,
  });
}
