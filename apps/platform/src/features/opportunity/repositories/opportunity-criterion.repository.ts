import type {
  OpportunityCriterion,
  OpportunityCriterionCategory,
  OpportunityCriterionScoringMethod,
  Prisma,
} from "@/generated/prisma/client";

import type {
  OpportunityTransactionClient,
} from "./opportunity.repository";

export type OpportunityCriterionRecord =
  OpportunityCriterion;

export type CreateOpportunityCriterionInput = {
  opportunityId: string;
  name: string;
  description?: string | null;
  category: OpportunityCriterionCategory;
  scoringMethod: OpportunityCriterionScoringMethod;
  weight: Prisma.Decimal;
  minimumScore?: Prisma.Decimal | null;
  required?: boolean;
  active?: boolean;
  displayOrder?: number;
};

export type UpdateOpportunityCriterionInput =
  Partial<
    Omit<
      CreateOpportunityCriterionInput,
      "opportunityId"
    >
  >;

export type OpportunityCriterionAuditInput = {
  workspaceId: string;
  actorUserId: string;
  opportunityId: string;
  criterionId: string;
  criterionName: string;
};

export type UpdateOpportunityCriterionAuditInput =
  OpportunityCriterionAuditInput & {
    changedFields: string[];
  };

export interface OpportunityCriterionRepository {
  listByOpportunity(
    transaction: OpportunityTransactionClient,
    opportunityId: string,
  ): Promise<OpportunityCriterionRecord[]>;

  findById(
    transaction: OpportunityTransactionClient,
    criterionId: string,
  ): Promise<OpportunityCriterionRecord | null>;

  findByName(
    transaction: OpportunityTransactionClient,
    opportunityId: string,
    name: string,
  ): Promise<OpportunityCriterionRecord | null>;

  create(
    transaction: OpportunityTransactionClient,
    input: CreateOpportunityCriterionInput,
  ): Promise<OpportunityCriterionRecord>;

  update(
    transaction: OpportunityTransactionClient,
    criterionId: string,
    input: UpdateOpportunityCriterionInput,
  ): Promise<OpportunityCriterionRecord | null>;

  delete(
    transaction: OpportunityTransactionClient,
    criterionId: string,
  ): Promise<void>;

  calculateTotalWeight(
    transaction: OpportunityTransactionClient,
    opportunityId: string,
  ): Promise<Prisma.Decimal>;

  createAuditLog(
    transaction: OpportunityTransactionClient,
    input: OpportunityCriterionAuditInput,
  ): Promise<void>;

  createUpdateAuditLog(
    transaction: OpportunityTransactionClient,
    input: UpdateOpportunityCriterionAuditInput,
  ): Promise<void>;

  createDeleteAuditLog(
    transaction: OpportunityTransactionClient,
    input: OpportunityCriterionAuditInput,
  ): Promise<void>;
}
