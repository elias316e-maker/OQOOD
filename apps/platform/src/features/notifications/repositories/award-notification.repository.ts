import type {
  Prisma,
} from "@/generated/prisma/client";

export type AwardNotificationTransaction =
  Prisma.TransactionClient;

export type AwardNotificationOpportunityRecord = {
  id: string;
  workspaceId: string;
  number: string;
  title: string;
  status: string;
};

export type AwardNotificationOfferRecord = {
  offerId: string;
  businessPartnerId: string;
  partnerName: string;
  partnerEmail: string | null;
  outcome: "WINNER" | "LOST";
  totalAmount: string;
  currency: string;
};

export type ExistingAwardDeliveryRecord = {
  id: string;
};

export type CreateAwardDeliveryInput = {
  workspaceId: string;
  businessPartnerId: string;
  recipient: string;
  category: string;
  subject: string;
  body: string;
  href: string;
  fingerprint: string;
  opportunityId: string;
  offerId: string;
  outcome: "WINNER" | "LOST";
};

export type CreatedAwardDeliveryRecord = {
  id: string;
};

export interface AwardNotificationRepository {
  findAwardedOpportunity(
    transaction: AwardNotificationTransaction,
    workspaceId: string,
    opportunityId: string,
  ): Promise<AwardNotificationOpportunityRecord | null>;

  listAwardedOffers(
    transaction: AwardNotificationTransaction,
    opportunityId: string,
  ): Promise<AwardNotificationOfferRecord[]>;

  findExistingDelivery(
    transaction: AwardNotificationTransaction,
    workspaceId: string,
    fingerprint: string,
  ): Promise<ExistingAwardDeliveryRecord | null>;

  createDelivery(
    transaction: AwardNotificationTransaction,
    input: CreateAwardDeliveryInput,
  ): Promise<CreatedAwardDeliveryRecord>;
}
