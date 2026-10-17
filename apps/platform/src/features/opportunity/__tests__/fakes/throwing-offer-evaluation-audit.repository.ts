import type {
  OpportunityTransactionClient,
} from "../../repositories/opportunity.repository";

import {
  PrismaOfferCriterionScoreRepository,
} from "../../repositories/prisma-offer-criterion-score.repository";

export class ThrowingOfferEvaluationAuditRepository
  extends PrismaOfferCriterionScoreRepository
{
  override async createEvaluationAuditLog(
    _transaction: OpportunityTransactionClient,
    _input: {
      workspaceId: string;
      actorUserId: string;
      opportunityId: string;
      offerId: string;
      criterionId?: string;
      action:
        | "offer.criterion.scored"
        | "offer.evaluation.completed";
      metadata?: Record<string, unknown>;
    },
  ): Promise<void> {
    throw new Error(
      "Injected Offer Evaluation Audit Failure",
    );
  }
}
