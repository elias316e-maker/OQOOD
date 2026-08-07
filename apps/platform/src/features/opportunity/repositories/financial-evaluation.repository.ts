import type {
  OpportunityTransactionClient,
} from "./opportunity.repository";

export type FinancialEvaluationOpportunityRecord = {
  id: string;
  workspaceId: string;
  number: string;
  title: string;
  currency: string;
  status: string;
};

export type FinancialEvaluationOfferRecord = {
  offerId: string;
  opportunityId: string;
  partnerName: string;
  referenceNumber: string | null;
  status: string;
  currency: string;
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
  deliveryDays: number | null;
  validityDays: number | null;
  paymentTerms: string | null;
  commercialNotes: string | null;
};

export type FinancialEvaluationAuditInput = {
  workspaceId: string;
  actorUserId: string;
  opportunityId: string;
  action:
    | "opportunity.financial_evaluation.completed"
    | "opportunity.award.recommended";
  metadata?: Record<string, unknown>;
};

export interface FinancialEvaluationRepository {
  findOpportunity(
    transaction: OpportunityTransactionClient,
    workspaceId: string,
    opportunityId: string,
  ): Promise<FinancialEvaluationOpportunityRecord | null>;

  listEligibleOffers(
    transaction: OpportunityTransactionClient,
    opportunityId: string,
  ): Promise<FinancialEvaluationOfferRecord[]>;

  markOffersFinanciallyEvaluated(
    transaction: OpportunityTransactionClient,
    opportunityId: string,
    offerIds: string[],
  ): Promise<void>;

  updateOpportunityStatus(
    transaction: OpportunityTransactionClient,
    opportunityId: string,
    status: "FINANCIAL_EVALUATION" | "AWARD_PENDING",
  ): Promise<void>;

  createFinancialEvaluationAuditLog(
    transaction: OpportunityTransactionClient,
    input: FinancialEvaluationAuditInput,
  ): Promise<void>;
}
