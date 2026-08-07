import type {
  OpportunityTransactionClient,
} from "../../repositories/opportunity.repository";

import {
  PrismaAwardRecommendationRepository,
} from "../../repositories/prisma-award-recommendation.repository";

export class ThrowingAwardStatusRepository
  extends PrismaAwardRecommendationRepository
{
  override async markOpportunityAwarded(
    _transaction: OpportunityTransactionClient,
    _opportunityId: string,
  ): Promise<Date> {
    throw new Error(
      "Injected Award Status Failure",
    );
  }
}
