export type NotificationDeliveryRecord = {
  id: string;
  channel: string;
  recipient: string;
  subject: string;
  body: string;
  href: string | null;
  status: string;
};

export type MarkNotificationDeliverySentInput = {
  deliveryId: string;
  providerId?: string;
  sentAt: Date;
};

export type MarkNotificationDeliveryFailedInput = {
  deliveryId: string;
  error: string;
};

export type MarkNotificationDeliveryPendingInput = {
  deliveryId: string;
  error: string;
};

export interface NotificationDeliveryRepository {
  findById(
    deliveryId: string,
  ): Promise<NotificationDeliveryRecord | null>;

  markSent(
    input: MarkNotificationDeliverySentInput,
  ): Promise<void>;

  markFailed(
    input: MarkNotificationDeliveryFailedInput,
  ): Promise<void>;

  markPending(
    input: MarkNotificationDeliveryPendingInput,
  ): Promise<void>;
}
