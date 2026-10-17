import type {
  FinancialEvaluationAuditInput,
} from "../../repositories/financial-evaluation.repository";

import type {
  OpportunityTransactionClient,
} from "../../repositories/opportunity.repository";

import {
  PrismaFinancialEvaluationRepository,
} from "../../repositories/prisma-financial-evaluation.repository";

export class ThrowingFinancialEvaluationAuditRepository
  extends PrismaFinancialEvaluationRepository
{
  override async createFinancialEvaluationAuditLog(
    _transaction: OpportunityTransactionClient,
    _input: FinancialEvaluationAuditInput,
  ): Promise<void> {
    throw new Error(
      "Injected Financial Evaluation Audit Failure",
    );
  }
}
