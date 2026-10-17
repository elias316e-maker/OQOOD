import type {
  CreateProcurementRequestItemRecordInput,
  ProcurementRequestItemRecord,
  UpdateProcurementRequestItemRecordInput,
} from "../dtos";

import type {
  ProcurementTransactionClient,
} from "./procurement-request.repository";

export interface ProcurementRequestItemRepository {
  findById(
    transaction: ProcurementTransactionClient,
    procurementRequestId: string,
    itemId: string,
  ): Promise<ProcurementRequestItemRecord | null>;

  findByRequestId(
    transaction: ProcurementTransactionClient,
    procurementRequestId: string,
  ): Promise<ProcurementRequestItemRecord[]>;

  create(
    transaction: ProcurementTransactionClient,
    input: CreateProcurementRequestItemRecordInput,
  ): Promise<ProcurementRequestItemRecord>;

  createMany(
    transaction: ProcurementTransactionClient,
    inputs:
      readonly CreateProcurementRequestItemRecordInput[],
  ): Promise<ProcurementRequestItemRecord[]>;

  update(
    transaction: ProcurementTransactionClient,
    procurementRequestId: string,
    itemId: string,
    input: UpdateProcurementRequestItemRecordInput,
  ): Promise<ProcurementRequestItemRecord | null>;

  delete(
    transaction: ProcurementTransactionClient,
    procurementRequestId: string,
    itemId: string,
  ): Promise<boolean>;

  deleteByRequestId(
    transaction: ProcurementTransactionClient,
    procurementRequestId: string,
  ): Promise<number>;
}
