import type {
  ContractAwardTransaction,
  CreateContractAwardAuditInput,
} from "../../repositories";

import {
  PrismaContractAwardRepository,
} from "../../repositories";

export class ThrowingContractAwardAuditRepository
  extends PrismaContractAwardRepository
{
  override async createAuditLog(
    _transaction: ContractAwardTransaction,
    _input: CreateContractAwardAuditInput,
  ): Promise<void> {
    throw new Error(
      "Injected Contract Award Audit Failure",
    );
  }
}
