export type DeliverNotificationInput = {
  deliveryId: string;
};

export interface NotificationDeliveryApplicationService {
  deliver(
    input: DeliverNotificationInput,
  ): Promise<void>;
}
