import type {
  OpportunityStatus,
} from "@/generated/prisma/client";

import type {
  OpportunityTransactionClient,
} from "../../repositories/opportunity.repository";

import {
  PrismaFinancialEvaluationRepository,
} from "../../repositories/prisma-financial-evaluation.repository";

export class ThrowingFinancialEvaluationStatusRepository
  extends PrismaFinancialEvaluationRepository
{
  override async updateOpportunityStatus(
    _transaction: OpportunityTransactionClient,
    _opportunityId: string,
    _status: OpportunityStatus,
  ): Promise<void> {
    throw new Error(
      "Injected Financial Evaluation Status Failure",
    );
  }
}
