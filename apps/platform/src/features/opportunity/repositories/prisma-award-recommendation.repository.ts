import type {
  AwardAuditInput,
  AwardOfferRecord,
  AwardOpportunityRecord,
  AwardRecommendationRepository,
} from "./award-recommendation.repository";

import type {
  OpportunityTransactionClient,
} from "./opportunity.repository";

export class PrismaAwardRecommendationRepository
  implements AwardRecommendationRepository
{
  async findOpportunity(
    transaction: OpportunityTransactionClient,
    workspaceId: string,
    opportunityId: string,
  ): Promise<AwardOpportunityRecord | null> {
    const opportunity =
      await transaction.opportunity.findFirst({
        where: {
          id: opportunityId,
          workspaceId,
        },
        select: {
          id: true,
          workspaceId: true,
          number: true,
          title: true,
          status: true,
        },
      });

    if (!opportunity) {
      return null;
    }

    return {
      id: opportunity.id,
      workspaceId: opportunity.workspaceId,
      number: opportunity.number,
      title: opportunity.title,
      status: opportunity.status,
    };
  }

  async findFinanciallyEvaluatedOffer(
    transaction: OpportunityTransactionClient,
    opportunityId: string,
    offerId: string,
  ): Promise<AwardOfferRecord | null> {
    const offer = await transaction.offer.findFirst({
      where: {
        id: offerId,
        opportunityId,
        status: "FINANCIALLY_EVALUATED",
      },
      select: {
        id: true,
        opportunityId: true,
        totalAmount: true,
        currency: true,
        status: true,
        businessPartner: {
          select: {
            nameAr: true,
          },
        },
      },
    });

    if (!offer) {
      return null;
    }

    return {
      offerId: offer.id,
      opportunityId: offer.opportunityId,
      partnerName: offer.businessPartner.nameAr,
      totalAmount: offer.totalAmount?.toString() ?? "0",
      currency: offer.currency,
      status: offer.status,
    };
  }

  async markWinningOffer(
    transaction: OpportunityTransactionClient,
    opportunityId: string,
    offerId: string,
  ): Promise<void> {
    await transaction.offer.updateMany({
      where: {
        id: offerId,
        opportunityId,
        status: "FINANCIALLY_EVALUATED",
      },
      data: {
        status: "WINNER",
      },
    });
  }

  async markOtherOffersLost(
    transaction: OpportunityTransactionClient,
    opportunityId: string,
    winningOfferId: string,
  ): Promise<void> {
    await transaction.offer.updateMany({
      where: {
        opportunityId,
        id: {
          not: winningOfferId,
        },
        status: {
          in: [
            "FINANCIALLY_EVALUATED",
            "TECHNICALLY_ACCEPTED",
          ],
        },
      },
      data: {
        status: "LOST",
      },
    });
  }

  async markOpportunityAwarded(
    transaction: OpportunityTransactionClient,
    opportunityId: string,
  ): Promise<Date> {
    const awardedAt = new Date();

    await transaction.opportunity.update({
      where: {
        id: opportunityId,
      },
      data: {
        status: "AWARDED",
        closedAt: awardedAt,
      },
    });

    return awardedAt;
  }

  async createAwardAuditLog(
    transaction: OpportunityTransactionClient,
    input: AwardAuditInput,
  ): Promise<void> {
    await transaction.auditLog.create({
      data: {
        workspaceId: input.workspaceId,
        userId: input.actorUserId,
        action: "opportunity.awarded",
        entityType: "Opportunity",
        entityId: input.opportunityId,
        metadata: {
          opportunityId: input.opportunityId,
          offerId: input.offerId,
          justification:
            input.justification ?? null,
          ...(input.metadata ?? {}),
          source:
            "AWARD_RECOMMENDATION_APPLICATION_SERVICE",
        },
      },
    });
  }
}
