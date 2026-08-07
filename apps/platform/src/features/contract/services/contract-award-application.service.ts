import type {
  CreateContractFromAwardRequest,
  CreateContractFromAwardResponse,
} from "../dtos";

export interface ContractAwardApplicationService {
  createFromAward(
    request: CreateContractFromAwardRequest,
  ): Promise<CreateContractFromAwardResponse>;
}
