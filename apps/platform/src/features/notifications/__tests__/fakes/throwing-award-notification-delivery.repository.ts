import type {
  AwardNotificationTransaction,
  CreateAwardDeliveryInput,
  CreatedAwardDeliveryRecord,
} from "../../repositories";

import {
  PrismaAwardNotificationRepository,
} from "../../repositories";

export class ThrowingAwardNotificationDeliveryRepository
  extends PrismaAwardNotificationRepository
{
  private createdDeliveries = 0;

  override async createDelivery(
    transaction: AwardNotificationTransaction,
    input: CreateAwardDeliveryInput,
  ): Promise<CreatedAwardDeliveryRecord> {
    this.createdDeliveries += 1;

    if (this.createdDeliveries === 2) {
      throw new Error(
        "Injected Award Notification Delivery Failure",
      );
    }

    return super.createDelivery(
      transaction,
      input,
    );
  }
}
