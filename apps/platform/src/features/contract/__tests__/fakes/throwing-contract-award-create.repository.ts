import type {
  ContractAwardTransaction,
  CreateDraftContractInput,
  ExistingContractRecord,
} from "../../repositories";

import {
  PrismaContractAwardRepository,
} from "../../repositories";

export class ThrowingContractAwardCreateRepository
  extends PrismaContractAwardRepository
{
  override async createDraftContract(
    _transaction: ContractAwardTransaction,
    _input: CreateDraftContractInput,
  ): Promise<ExistingContractRecord> {
    throw new Error(
      "Injected Contract Award Creation Failure",
    );
  }
}
