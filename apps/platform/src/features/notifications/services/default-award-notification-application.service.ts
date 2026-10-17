import type {
  PrismaClient,
} from "@/generated/prisma/client";

import {
  Permissions,
} from "@/lib/permissions";

import {
  prisma,
} from "@/lib/prisma";

import {
  PrismaOpportunityAuthorizationGateway,
  type OpportunityAuthorizationGateway,
} from "@/features/opportunity/authorization";

import type {
  QueueAwardNotificationsRequest,
  QueueAwardNotificationsResponse,
  QueuedAwardNotification,
} from "../dtos";

import {
  PrismaAwardNotificationRepository,
  type AwardNotificationOfferRecord,
  type AwardNotificationRepository,
} from "../repositories";

import {
  queueAwardNotificationsSchema,
} from "../validators";

import type {
  AwardNotificationApplicationService,
} from "./award-notification-application.service";

type AwardNotificationTransactionRunner = Pick<
  PrismaClient,
  "$transaction"
>;

function buildFingerprint(
  opportunityId: string,
  offer: AwardNotificationOfferRecord,
): string {
  return [
    "opportunity-award-result",
    opportunityId,
    offer.businessPartnerId,
    offer.outcome,
  ].join(":");
}

function buildSubject(
  opportunityNumber: string,
  outcome: "WINNER" | "LOST",
): string {
  return outcome === "WINNER"
    ? `إشعار ترسية المنافسة ${opportunityNumber}`
    : `إشعار نتيجة المنافسة ${opportunityNumber}`;
}

function buildBody(
  opportunity: {
    number: string;
    title: string;
  },
  offer: AwardNotificationOfferRecord,
): string {
  if (offer.outcome === "WINNER") {
    return [
      `السادة/ ${offer.partnerName}`,
      "",
      `نفيدكم بأنه تمت ترسية المنافسة رقم ${opportunity.number} بعنوان "${opportunity.title}" على عرضكم.`,
      "",
      `قيمة العرض المعتمدة: ${offer.totalAmount} ${offer.currency}.`,
      "",
      "سيتم التواصل معكم لاستكمال إجراءات إعداد العقد والتوقيع.",
      "",
      "وتفضلوا بقبول التحية.",
    ].join("\n");
  }

  return [
    `السادة/ ${offer.partnerName}`,
    "",
    `نشكر لكم مشاركتكم في المنافسة رقم ${opportunity.number} بعنوان "${opportunity.title}".`,
    "",
    "نفيدكم بأنه تم اعتماد نتيجة المنافسة ولم تتم ترسية المنافسة على عرضكم.",
    "",
    "نقدر مشاركتكم ونتطلع إلى تعاونكم في فرص قادمة.",
    "",
    "وتفضلوا بقبول التحية.",
  ].join("\n");
}

export class DefaultAwardNotificationApplicationService
  implements AwardNotificationApplicationService
{
  constructor(
    private readonly repository:
      AwardNotificationRepository =
        new PrismaAwardNotificationRepository(),

    private readonly authorization:
      OpportunityAuthorizationGateway =
        new PrismaOpportunityAuthorizationGateway(),

    private readonly transactionRunner:
      AwardNotificationTransactionRunner = prisma,
  ) {}

  async queueForOpportunity(
    request: QueueAwardNotificationsRequest,
  ): Promise<QueueAwardNotificationsResponse> {
    const validation =
      queueAwardNotificationsSchema.safeParse(
        request,
      );

    if (!validation.success) {
      throw new Error(
        validation.error.issues[0]?.message ??
          "بيانات جدولة إشعارات الترسية غير صحيحة.",
      );
    }

    const input = validation.data;

    return this.transactionRunner.$transaction(
      async (transaction) => {
        const authorized =
          await this.authorization.authorize(
            transaction,
            {
              workspaceId:
                input.workspaceId,
              actorUserId:
                input.actorUserId,
              permission:
                Permissions.opportunities.read,
              requireWriteAccess: true,
            },
          );

        const opportunity =
          await this.repository.findAwardedOpportunity(
            transaction,
            authorized.workspaceId,
            input.opportunityId,
          );

        if (!opportunity) {
          throw new Error(
            "لا يمكن جدولة إشعارات الترسية قبل اعتماد نتيجة المنافسة.",
          );
        }

        const offers =
          await this.repository.listAwardedOffers(
            transaction,
            opportunity.id,
          );

        const deliveries: QueuedAwardNotification[] =
          [];

        let skippedCount = 0;

        for (const offer of offers) {
          if (!offer.partnerEmail) {
            skippedCount += 1;
            continue;
          }

          const fingerprint =
            buildFingerprint(
              opportunity.id,
              offer,
            );

          const existing =
            await this.repository.findExistingDelivery(
              transaction,
              authorized.workspaceId,
              fingerprint,
            );

          if (existing) {
            deliveries.push({
              deliveryId:
                existing.id,
              businessPartnerId:
                offer.businessPartnerId,
              recipient:
                offer.partnerEmail,
              outcome:
                offer.outcome,
              created:
                false,
            });

            continue;
          }

          const delivery =
            await this.repository.createDelivery(
              transaction,
              {
                workspaceId:
                  authorized.workspaceId,
                businessPartnerId:
                  offer.businessPartnerId,
                recipient:
                  offer.partnerEmail,
                category:
                  "OPPORTUNITY_AWARD_RESULT",
                subject:
                  buildSubject(
                    opportunity.number,
                    offer.outcome,
                  ),
                body:
                  buildBody(
                    opportunity,
                    offer,
                  ),
                href:
                  `/platform/opportunities/${opportunity.id}/award`,
                fingerprint,
                opportunityId:
                  opportunity.id,
                offerId:
                  offer.offerId,
                outcome:
                  offer.outcome,
              },
            );

          deliveries.push({
            deliveryId:
              delivery.id,
            businessPartnerId:
              offer.businessPartnerId,
            recipient:
              offer.partnerEmail,
            outcome:
              offer.outcome,
            created:
              true,
          });
        }

        return {
          opportunityId:
            opportunity.id,
          queuedCount:
            deliveries.filter(
              (delivery) =>
                delivery.created,
            ).length,
          skippedCount,
          deliveries,
        };
      },
    );
  }
}
