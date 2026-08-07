import type {
  OfferCriterionScore,
  Prisma,
} from "@/generated/prisma/client";

import type {
  OpportunityTransactionClient,
} from "./opportunity.repository";

export type OfferCriterionScoreRecord =
  OfferCriterionScore;

export type OfferEvaluationContext = {
  offerId: string;
  opportunityId: string;
  workspaceId: string;
  partnerName: string;
  referenceNumber: string | null;
  status: string;
};

export type OfferCriterionEvaluationRow = {
  criterionId: string;
  criterionName: string;
  category: string;
  scoringMethod: string;
  weight: Prisma.Decimal;
  minimumScore: Prisma.Decimal | null;
  required: boolean;
  active: boolean;
  displayOrder: number;
  scoreRecord: OfferCriterionScoreRecord | null;
};

export type UpsertOfferCriterionScoreInput = {
  offerId: string;
  criterionId: string;
  score?: Prisma.Decimal | null;
  passed?: boolean | null;
  notes?: string | null;
  evaluatedById: string;
  evaluatedAt?: Date;
};

export type OfferEvaluationSummary = {
  offerId: string;
  totalWeightedScore: Prisma.Decimal;
  evaluatedWeight: Prisma.Decimal;
  totalActiveWeight: Prisma.Decimal;
  requiredCriteriaCount: number;
  passedRequiredCriteriaCount: number;
  failedRequiredCriteriaCount: number;
  completedCriteriaCount: number;
  totalCriteriaCount: number;
  complete: boolean;
  passed: boolean;
};

export interface OfferCriterionScoreRepository {
  findOfferContext(
    transaction: OpportunityTransactionClient,
    workspaceId: string,
    offerId: string,
  ): Promise<OfferEvaluationContext | null>;

  listEvaluationRows(
    transaction: OpportunityTransactionClient,
    offerId: string,
  ): Promise<OfferCriterionEvaluationRow[]>;

  listByOffer(
    transaction: OpportunityTransactionClient,
    offerId: string,
  ): Promise<OfferCriterionScoreRecord[]>;

  findByOfferAndCriterion(
    transaction: OpportunityTransactionClient,
    offerId: string,
    criterionId: string,
  ): Promise<OfferCriterionScoreRecord | null>;

  upsert(
    transaction: OpportunityTransactionClient,
    input: UpsertOfferCriterionScoreInput,
  ): Promise<OfferCriterionScoreRecord>;

  deleteByOfferAndCriterion(
    transaction: OpportunityTransactionClient,
    offerId: string,
    criterionId: string,
  ): Promise<void>;

  deleteByOffer(
    transaction: OpportunityTransactionClient,
    offerId: string,
  ): Promise<void>;

  calculateOfferEvaluation(
    transaction: OpportunityTransactionClient,
    offerId: string,
  ): Promise<OfferEvaluationSummary>;

  updateOfferStatus(
    transaction: OpportunityTransactionClient,
    offerId: string,
    status:
      | "UNDER_REVIEW"
      | "TECHNICALLY_ACCEPTED"
      | "TECHNICALLY_REJECTED",
  ): Promise<void>;

  createEvaluationAuditLog(
    transaction: OpportunityTransactionClient,
    input: {
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
  ): Promise<void>;
}
