import {
  PrismaOpportunityRepository,
  type OpportunityTransactionClient,
  type PublishOpportunityAuditInput,
} from "../../repositories";

export class ThrowingOpportunityPublishAuditRepository
  extends PrismaOpportunityRepository
{
  override async createPublishAuditLog(
    _transaction: OpportunityTransactionClient,
    _input: PublishOpportunityAuditInput,
  ): Promise<void> {
    throw new Error(
      "Injected Opportunity Publish Audit Failure",
    );
  }
}
