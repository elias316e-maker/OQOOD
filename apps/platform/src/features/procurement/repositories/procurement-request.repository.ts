import type {
  Prisma,
} from "@/generated/prisma/client";

import type {
  CreateProcurementRequestRecordInput,
  ProcurementRequestListFilters,
  ProcurementRequestListInput,
  ProcurementRequestRecord,
  UpdateProcurementRequestRecordInput,
} from "../dtos";


export type CreateProcurementRequestAuditInput = {
  workspaceId: string;
  actorUserId: string;
  procurementRequestId: string;
  procurementRequestNumber: string;
  itemCount: number;
};

export type ProcurementTransactionClient =
  Prisma.TransactionClient;

export interface ProcurementRequestRepository {
  findById(
    transaction: ProcurementTransactionClient,
    workspaceId: string,
    procurementRequestId: string,
  ): Promise<ProcurementRequestRecord | null>;

  findByNumber(
    transaction: ProcurementTransactionClient,
    workspaceId: string,
    number: string,
  ): Promise<ProcurementRequestRecord | null>;

  existsByNumber(
    transaction: ProcurementTransactionClient,
    workspaceId: string,
    number: string,
  ): Promise<boolean>;

  listByWorkspace(
    transaction: ProcurementTransactionClient,
    input: ProcurementRequestListInput,
  ): Promise<ProcurementRequestRecord[]>;

  countByWorkspace(
    transaction: ProcurementTransactionClient,
    workspaceId: string,
    filters?: ProcurementRequestListFilters,
  ): Promise<number>;

  create(
    transaction: ProcurementTransactionClient,
    input: CreateProcurementRequestRecordInput,
  ): Promise<ProcurementRequestRecord>;

  update(
    transaction: ProcurementTransactionClient,
    workspaceId: string,
    procurementRequestId: string,
    input: UpdateProcurementRequestRecordInput,
  ): Promise<ProcurementRequestRecord | null>;

  createAuditLog(
    transaction: ProcurementTransactionClient,
    input: CreateProcurementRequestAuditInput,
  ): Promise<void>;
}
