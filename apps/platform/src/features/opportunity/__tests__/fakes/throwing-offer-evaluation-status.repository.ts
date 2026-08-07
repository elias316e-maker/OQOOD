import type {
  OpportunityTransactionClient,
} from "../../repositories/opportunity.repository";

import {
  PrismaOfferCriterionScoreRepository,
} from "../../repositories/prisma-offer-criterion-score.repository";

export class ThrowingOfferEvaluationStatusRepository
  extends PrismaOfferCriterionScoreRepository
{
  override async updateOfferStatus(
    _transaction: OpportunityTransactionClient,
    _offerId: string,
    _status:
      | "UNDER_REVIEW"
      | "TECHNICALLY_ACCEPTED"
      | "TECHNICALLY_REJECTED",
  ): Promise<void> {
    throw new Error(
      "Injected Offer Evaluation Status Failure",
    );
  }
}
