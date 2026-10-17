import type {
  CreateOpportunityAuditInput,
  OpportunityTransactionClient,
} from "../../repositories";

import {
  PrismaOpportunityRepository,
} from "../../repositories";

export class ThrowingOpportunityAuditRepository
  extends PrismaOpportunityRepository
{
  override async createAuditLog(
    _transaction: OpportunityTransactionClient,
    _input: CreateOpportunityAuditInput,
  ): Promise<void> {
    throw new Error(
      "Injected Opportunity Audit Failure",
    );
  }
}
