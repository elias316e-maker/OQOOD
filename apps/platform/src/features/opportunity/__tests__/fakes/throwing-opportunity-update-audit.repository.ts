import {
  PrismaOpportunityRepository,
  type OpportunityTransactionClient,
  type UpdateOpportunityAuditInput,
} from "../../repositories";

export class ThrowingOpportunityUpdateAuditRepository
  extends PrismaOpportunityRepository
{
  override async createUpdateAuditLog(
    _transaction: OpportunityTransactionClient,
    _input: UpdateOpportunityAuditInput,
  ): Promise<void> {
    throw new Error(
      "Injected Opportunity Update Audit Failure",
    );
  }
}
