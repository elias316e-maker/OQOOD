import type {
  OpportunityTransactionClient,
} from "../../repositories/opportunity.repository";

import type {
  OfferCriterionScoreRecord,
  UpsertOfferCriterionScoreInput,
} from "../../repositories/offer-criterion-score.repository";

import {
  PrismaOfferCriterionScoreRepository,
} from "../../repositories/prisma-offer-criterion-score.repository";

export class ThrowingOfferEvaluationUpsertRepository
  extends PrismaOfferCriterionScoreRepository
{
  override async upsert(
    _transaction: OpportunityTransactionClient,
    _input: UpsertOfferCriterionScoreInput,
  ): Promise<OfferCriterionScoreRecord> {
    throw new Error(
      "Injected Offer Evaluation Upsert Failure",
    );
  }
}
