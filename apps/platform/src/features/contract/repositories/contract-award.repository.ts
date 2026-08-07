import type {
  Prisma,
} from "@/generated/prisma/client";

export type ContractAwardTransaction =
  Prisma.TransactionClient;

export type AwardOpportunityRecord = {
  id: string;
  workspaceId: string;
  projectId: string | null;
  number: string;
  title: string;
  description: string | null;
};

export type WinningOfferItemRecord = {
  lineNumber: number;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  totalPrice: string;
  notes: string | null;
};

export type WinningOfferRecord = {
  id: string;
  businessPartnerId: string;
  currency: string;
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
  paymentTerms: string | null;
  deliveryDays: number | null;
  items: WinningOfferItemRecord[];
};

export type ExistingContractRecord = {
  id: string;
  number: string;
};

export type CreateDraftContractInput = {
  workspaceId: string;
  projectId: string | null;
  opportunityId: string;
  sourceOfferId: string;
  businessPartnerId: string;
  number: string;
  title: string;
  description: string | null;
  currency: string;
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
  paymentTerms: string | null;
  deliveryDays: number | null;
  createdById: string;
  items: WinningOfferItemRecord[];
};

export type CreateContractAwardAuditInput = {
  workspaceId: string;
  actorUserId: string;
  contractId: string;
  contractNumber: string;
  opportunityId: string;
  opportunityNumber: string;
  sourceOfferId: string;
  businessPartnerId: string;
};

export interface ContractAwardRepository {
  findAwardedOpportunity(
    transaction: ContractAwardTransaction,
    workspaceId: string,
    opportunityId: string,
  ): Promise<AwardOpportunityRecord | null>;

  findWinningOffer(
    transaction: ContractAwardTransaction,
    opportunityId: string,
  ): Promise<WinningOfferRecord | null>;

  findExistingContract(
    transaction: ContractAwardTransaction,
    offerId: string,
  ): Promise<ExistingContractRecord | null>;

  createDraftContract(
    transaction: ContractAwardTransaction,
    input: CreateDraftContractInput,
  ): Promise<ExistingContractRecord>;

  createAuditLog(
    transaction: ContractAwardTransaction,
    input: CreateContractAwardAuditInput,
  ): Promise<void>;
}
