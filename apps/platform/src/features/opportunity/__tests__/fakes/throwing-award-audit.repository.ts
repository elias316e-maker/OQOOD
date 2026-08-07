import type {
  AwardAuditInput,
} from "../../repositories/award-recommendation.repository";

import type {
  OpportunityTransactionClient,
} from "../../repositories/opportunity.repository";

import {
  PrismaAwardRecommendationRepository,
} from "../../repositories/prisma-award-recommendation.repository";

export class ThrowingAwardAuditRepository
  extends PrismaAwardRecommendationRepository
{
  override async createAwardAuditLog(
    _transaction: OpportunityTransactionClient,
    _input: AwardAuditInput,
  ): Promise<void> {
    throw new Error(
      "Injected Award Audit Failure",
    );
  }
}
