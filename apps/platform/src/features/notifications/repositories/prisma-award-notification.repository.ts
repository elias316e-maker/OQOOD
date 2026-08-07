import type {
  Prisma,
} from "@/generated/prisma/client";

import type {
  AwardNotificationOfferRecord,
  AwardNotificationOpportunityRecord,
  AwardNotificationRepository,
  AwardNotificationTransaction,
  CreateAwardDeliveryInput,
  CreatedAwardDeliveryRecord,
  ExistingAwardDeliveryRecord,
} from "./award-notification.repository";

function buildDeliveryMarker(
  fingerprint: string,
): string {
  return `<!-- oqood-notification:${fingerprint} -->`;
}

export class PrismaAwardNotificationRepository
  implements AwardNotificationRepository
{
  async findAwardedOpportunity(
    transaction: AwardNotificationTransaction,
    workspaceId: string,
    opportunityId: string,
  ): Promise<AwardNotificationOpportunityRecord | null> {
    return transaction.opportunity.findFirst({
      where: {
        id: opportunityId,
        workspaceId,
        status: "AWARDED",
      },
      select: {
        id: true,
        workspaceId: true,
        number: true,
        title: true,
        status: true,
      },
    });
  }

  async listAwardedOffers(
    transaction: AwardNotificationTransaction,
    opportunityId: string,
  ): Promise<AwardNotificationOfferRecord[]> {
    const offers =
      await transaction.offer.findMany({
        where: {
          opportunityId,
          status: {
            in: [
              "WINNER",
              "LOST",
            ],
          },
        },
        select: {
          id: true,
          status: true,
          totalAmount: true,
          currency: true,
          businessPartner: {
            select: {
              id: true,
              nameAr: true,
              nameEn: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      });

    return offers.map((offer) => ({
      offerId: offer.id,
      businessPartnerId:
        offer.businessPartner.id,
      partnerName:
        offer.businessPartner.nameAr ||
        offer.businessPartner.nameEn ||
        "المورد",
      partnerEmail:
        offer.businessPartner.email,
      outcome:
        offer.status === "WINNER"
          ? "WINNER"
          : "LOST",
      totalAmount:
        offer.totalAmount?.toString() ?? "0",
      currency:
        offer.currency,
    }));
  }

  async findExistingDelivery(
    transaction: AwardNotificationTransaction,
    workspaceId: string,
    fingerprint: string,
  ): Promise<ExistingAwardDeliveryRecord | null> {
    const marker =
      buildDeliveryMarker(fingerprint);

    return transaction.notificationDelivery.findFirst({
      where: {
        workspaceId,
        category:
          "OPPORTUNITY_AWARD_RESULT",
        body: {
          contains: marker,
        },
      },
      select: {
        id: true,
      },
    });
  }

  async createDelivery(
    transaction: AwardNotificationTransaction,
    input: CreateAwardDeliveryInput,
  ): Promise<CreatedAwardDeliveryRecord> {
    const marker =
      buildDeliveryMarker(
        input.fingerprint,
      );

    const metadata = {
      fingerprint:
        input.fingerprint,
      businessPartnerId:
        input.businessPartnerId,
      opportunityId:
        input.opportunityId,
      offerId:
        input.offerId,
      outcome:
        input.outcome,
    } satisfies Prisma.JsonObject;

    const body = [
      input.body,
      "",
      marker,
      `<!-- oqood-metadata:${JSON.stringify(
        metadata,
      )} -->`,
    ].join("\n");

    return transaction.notificationDelivery.create({
      data: {
        workspaceId:
          input.workspaceId,
        userId: null,
        category:
          input.category,
        channel: "EMAIL",
        recipient:
          input.recipient,
        subject:
          input.subject,
        body,
        href:
          input.href,
        status: "PENDING",
        attempts: 0,
        scheduledAt:
          new Date(),
      },
      select: {
        id: true,
      },
    });
  }
}
