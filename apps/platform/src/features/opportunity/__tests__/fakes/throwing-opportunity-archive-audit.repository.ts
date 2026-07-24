import {
  PrismaOpportunityRepository,
  type ArchiveOpportunityAuditInput,
  type OpportunityTransactionClient,
} from "../../repositories";

export class ThrowingOpportunityArchiveAuditRepository
  extends PrismaOpportunityRepository
{
  override async createArchiveAuditLog(
    _transaction: OpportunityTransactionClient,
    _input: ArchiveOpportunityAuditInput,
  ): Promise<void> {
    throw new Error(
      "Injected Opportunity Archive Audit Failure",
    );
  }
}
