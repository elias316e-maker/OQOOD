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
} from "../authorization";

import type {
  AwardRecommendationRequest,
  AwardRecommendationResponse,
} from "../dtos";

import {
  OpportunityNotFoundError,
  OpportunityValidationError,
} from "../errors";

import {
  PrismaAwardRecommendationRepository,
  type AwardRecommendationRepository,
} from "../repositories";

import {
  awardRecommendationSchema,
} from "../validators";

import type {
  AwardRecommendationApplicationService,
} from "./award-recommendation-application.service";

type AwardTransactionRunner = Pick<
  PrismaClient,
  "$transaction"
>;

export class DefaultAwardRecommendationApplicationService
  implements AwardRecommendationApplicationService
{
  constructor(
    private readonly repository:
      AwardRecommendationRepository =
        new PrismaAwardRecommendationRepository(),

    private readonly authorization:
      OpportunityAuthorizationGateway =
        new PrismaOpportunityAuthorizationGateway(),

    private readonly transactionRunner:
      AwardTransactionRunner = prisma,
  ) {}

  async recommend(
    request: AwardRecommendationRequest,
  ): Promise<AwardRecommendationResponse> {
    const validation =
      awardRecommendationSchema.safeParse(
        request,
      );

    if (!validation.success) {
      throw new OpportunityValidationError(
        validation.error.flatten(),
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
                Permissions.opportunities.award,
              requireWriteAccess: true,
            },
          );

        const opportunity =
          await this.repository.findOpportunity(
            transaction,
            authorized.workspaceId,
            input.opportunityId,
          );

        if (!opportunity) {
          throw new OpportunityNotFoundError(
            input.opportunityId,
          );
        }

        if (
          opportunity.status !==
          "AWARD_PENDING"
        ) {
          throw new Error(
            "يجب إنشاء توصية الترسية قبل اعتماد العرض الفائز.",
          );
        }

        const offer =
          await this.repository
            .findFinanciallyEvaluatedOffer(
              transaction,
              opportunity.id,
              input.offerId,
            );

        if (!offer) {
          throw new Error(
            "العرض المحدد غير مؤهل للترسية.",
          );
        }

        await this.repository.markWinningOffer(
          transaction,
          opportunity.id,
          offer.offerId,
        );

        await this.repository.markOtherOffersLost(
          transaction,
          opportunity.id,
          offer.offerId,
        );

        const awardedAt =
          await this.repository
            .markOpportunityAwarded(
              transaction,
              opportunity.id,
            );

        await this.repository.createAwardAuditLog(
          transaction,
          {
            workspaceId:
              authorized.workspaceId,
            actorUserId:
              authorized.actorUserId,
            opportunityId:
              opportunity.id,
            offerId: offer.offerId,
            justification:
              input.justification ?? null,
            metadata: {
              opportunityNumber:
                opportunity.number,
              previousOpportunityStatus:
                opportunity.status,
              targetOpportunityStatus:
                "AWARDED",
              previousOfferStatus:
                offer.status,
              targetOfferStatus:
                "WINNER",
              awardedAt:
                awardedAt.toISOString(),
            },
          },
        );

        return {
          opportunity: {
            id: opportunity.id,
            number: opportunity.number,
            title: opportunity.title,
            status: "AWARDED",
          },
          awardedOffer: {
            offerId: offer.offerId,
            partnerName:
              offer.partnerName,
            totalAmount:
              offer.totalAmount,
            currency: offer.currency,
          },
          summary: {
            awardedAt:
              awardedAt.toISOString(),
            recommendedBy:
              authorized.actorUserId,
          },
        };
      },
    );
  }
}
