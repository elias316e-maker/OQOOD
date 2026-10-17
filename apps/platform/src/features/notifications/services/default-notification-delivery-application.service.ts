import type {
  NotificationEmailProvider,
} from "../providers";

import type {
  NotificationDeliveryRepository,
} from "../repositories";

import type {
  DeliverNotificationInput,
  NotificationDeliveryApplicationService,
} from "./notification-delivery-application.service";

const PROVIDER_NOT_CONFIGURED_ERROR =
  "Email provider is not configured.";

const UNSUPPORTED_CHANNEL_ERROR =
  "Unsupported notification delivery channel.";

export class DefaultNotificationDeliveryApplicationService
  implements NotificationDeliveryApplicationService
{
  constructor(
    private readonly repository:
      NotificationDeliveryRepository,
    private readonly emailProvider:
      NotificationEmailProvider,
  ) {}

  async deliver(
    input: DeliverNotificationInput,
  ): Promise<void> {
    const delivery =
      await this.repository.findById(
        input.deliveryId,
      );

    if (!delivery || delivery.status === "SENT") {
      return;
    }

    if (delivery.channel !== "EMAIL") {
      await this.repository.markFailed({
        deliveryId: delivery.id,
        error: UNSUPPORTED_CHANNEL_ERROR,
      });

      return;
    }

    if (!this.emailProvider.isConfigured()) {
      await this.repository.markPending({
        deliveryId: delivery.id,
        error: PROVIDER_NOT_CONFIGURED_ERROR,
      });

      return;
    }

    try {
      const result =
        await this.emailProvider.send({
          recipient:
            delivery.recipient,
          subject:
            delivery.subject,
          body:
            delivery.body,
          href:
            delivery.href,
          idempotencyKey:
            delivery.id,
        });

      await this.repository.markSent({
        deliveryId:
          delivery.id,
        providerId:
          result.providerId,
        sentAt:
          new Date(),
      });
    } catch (error) {
      await this.repository.markFailed({
        deliveryId:
          delivery.id,
        error:
          error instanceof Error
            ? error.message.slice(0, 500)
            : "Unknown delivery error",
      });
    }
  }
}
