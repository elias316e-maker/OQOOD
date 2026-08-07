import type {
  OpportunityTransactionClient,
} from "./opportunity.repository";

export type AwardOpportunityRecord = {
  id: string;
  workspaceId: string;
  number: string;
  title: string;
  status: string;
};

export type AwardOfferRecord = {
  offerId: string;
  opportunityId: string;
  partnerName: string;
  totalAmount: string;
  currency: string;
  status: string;
};

export type AwardAuditInput = {
  workspaceId: string;
  actorUserId: string;
  opportunityId: string;
  offerId: string;
  justification?: string | null;
  metadata?: Record<string, unknown>;
};

export interface AwardRecommendationRepository {
  findOpportunity(
    transaction: OpportunityTransactionClient,
    workspaceId: string,
    opportunityId: string,
  ): Promise<AwardOpportunityRecord | null>;

  findFinanciallyEvaluatedOffer(
    transaction: OpportunityTransactionClient,
    opportunityId: string,
    offerId: string,
  ): Promise<AwardOfferRecord | null>;

  markWinningOffer(
    transaction: OpportunityTransactionClient,
    opportunityId: string,
    offerId: string,
  ): Promise<void>;

  markOtherOffersLost(
    transaction: OpportunityTransactionClient,
    opportunityId: string,
    winningOfferId: string,
  ): Promise<void>;

  markOpportunityAwarded(
    transaction: OpportunityTransactionClient,
    opportunityId: string,
  ): Promise<Date>;

  createAwardAuditLog(
    transaction: OpportunityTransactionClient,
    input: AwardAuditInput,
  ): Promise<void>;
}
