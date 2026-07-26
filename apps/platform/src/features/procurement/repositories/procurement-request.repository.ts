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

export type UpdateProcurementRequestAuditInput = {
  workspaceId: string;
  actorUserId: string;
  procurementRequestId: string;
  procurementRequestNumber: string;
  changedFields: string[];
  itemCount: number;
};

export type SubmitProcurementRequestAuditInput = {
  workspaceId: string;
  actorUserId: string;
  procurementRequestId: string;
  procurementRequestNumber: string;
  previousStatus:
    ProcurementRequestRecord["status"];
  itemCount: number;
  submittedAt: Date;
};

export type StartProcurementReviewAuditInput = {
  workspaceId: string;
  actorUserId: string;
  procurementRequestId: string;
  procurementRequestNumber: string;
  previousStatus:
    ProcurementRequestRecord["status"];
  reviewStartedAt: Date;
};

export type RequestProcurementChangesAuditInput = {
  workspaceId: string;
  actorUserId: string;
  procurementRequestId: string;
  procurementRequestNumber: string;
  previousStatus:
    ProcurementRequestRecord["status"];
  reason: string;
  changesRequestedAt: Date;
};

export type ApproveProcurementRequestAuditInput = {
  workspaceId: string;
  actorUserId: string;
  procurementRequestId: string;
  procurementRequestNumber: string;
  previousStatus:
    ProcurementRequestRecord["status"];
  reason: string | null;
  approvedAt: Date;
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

  createUpdateAuditLog(
    transaction: ProcurementTransactionClient,
    input: UpdateProcurementRequestAuditInput,
  ): Promise<void>;

  createSubmitAuditLog(
    transaction: ProcurementTransactionClient,
    input: SubmitProcurementRequestAuditInput,
  ): Promise<void>;

  createStartReviewAuditLog(
    transaction: ProcurementTransactionClient,
    input: StartProcurementReviewAuditInput,
  ): Promise<void>;

  createRequestChangesAuditLog(
    transaction: ProcurementTransactionClient,
    input: RequestProcurementChangesAuditInput,
  ): Promise<void>;

  createApproveAuditLog(
    transaction: ProcurementTransactionClient,
    input: ApproveProcurementRequestAuditInput,
  ): Promise<void>;
}
