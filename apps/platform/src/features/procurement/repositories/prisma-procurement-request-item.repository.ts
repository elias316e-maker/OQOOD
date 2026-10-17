import type {
  Prisma,
} from "@/generated/prisma/client";

import type {
  CreateProcurementRequestItemRecordInput,
  ProcurementRequestItemRecord,
  UpdateProcurementRequestItemRecordInput,
} from "../dtos";

import type {
  ProcurementRequestItemRepository,
} from "./procurement-request-item.repository";

import type {
  ProcurementTransactionClient,
} from "./procurement-request.repository";

const procurementRequestItemSelect = {
  id: true,
  procurementRequestId: true,
  lineNumber: true,
  type: true,
  description: true,
  quantity: true,
  unit: true,
  specification: true,
  estimatedUnitPrice: true,
  estimatedTotal: true,
  requiredByDate: true,
  deliveryLocation: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProcurementRequestItemSelect;

export class PrismaProcurementRequestItemRepository
  implements ProcurementRequestItemRepository
{
  async findById(
    transaction: ProcurementTransactionClient,
    procurementRequestId: string,
    itemId: string,
  ): Promise<ProcurementRequestItemRecord | null> {
    return transaction.procurementRequestItem.findFirst({
      where: {
        id: itemId,
        procurementRequestId,
      },
      select: procurementRequestItemSelect,
    });
  }

  async findByRequestId(
    transaction: ProcurementTransactionClient,
    procurementRequestId: string,
  ): Promise<ProcurementRequestItemRecord[]> {
    return transaction.procurementRequestItem.findMany({
      where: {
        procurementRequestId,
      },
      select: procurementRequestItemSelect,
      orderBy: [
        {
          lineNumber: "asc",
        },
        {
          id: "asc",
        },
      ],
    });
  }

  async create(
    transaction: ProcurementTransactionClient,
    input: CreateProcurementRequestItemRecordInput,
  ): Promise<ProcurementRequestItemRecord> {
    return transaction.procurementRequestItem.create({
      data: {
        procurementRequestId:
          input.procurementRequestId,
        lineNumber: input.lineNumber,
        type: input.type,
        description: input.description,
        quantity: input.quantity,
        unit: input.unit,
        specification: input.specification,
        estimatedUnitPrice:
          input.estimatedUnitPrice,
        estimatedTotal:
          input.estimatedTotal,
        requiredByDate:
          input.requiredByDate,
        deliveryLocation:
          input.deliveryLocation,
        notes: input.notes,
      },
      select: procurementRequestItemSelect,
    });
  }

  async createMany(
    transaction: ProcurementTransactionClient,
    inputs:
      readonly CreateProcurementRequestItemRecordInput[],
  ): Promise<ProcurementRequestItemRecord[]> {
    if (inputs.length === 0) {
      return [];
    }

    const orderedInputs = [
      ...inputs,
    ].sort(
      (left, right) =>
        left.lineNumber -
        right.lineNumber,
    );

    const createdItems:
      ProcurementRequestItemRecord[] = [];

    for (const input of orderedInputs) {
      const item =
        await transaction.procurementRequestItem.create({
          data: {
            procurementRequestId:
              input.procurementRequestId,
            lineNumber:
              input.lineNumber,
            type: input.type,
            description:
              input.description,
            quantity:
              input.quantity,
            unit: input.unit,
            specification:
              input.specification,
            estimatedUnitPrice:
              input.estimatedUnitPrice,
            estimatedTotal:
              input.estimatedTotal,
            requiredByDate:
              input.requiredByDate,
            deliveryLocation:
              input.deliveryLocation,
            notes: input.notes,
          },
          select:
            procurementRequestItemSelect,
        });

      createdItems.push(item);
    }

    return createdItems;
  }

  async update(
    transaction: ProcurementTransactionClient,
    procurementRequestId: string,
    itemId: string,
    input: UpdateProcurementRequestItemRecordInput,
  ): Promise<ProcurementRequestItemRecord | null> {
    const existing =
      await transaction.procurementRequestItem.findFirst({
        where: {
          id: itemId,
          procurementRequestId,
        },
        select: {
          id: true,
        },
      });

    if (!existing) {
      return null;
    }

    return transaction.procurementRequestItem.update({
      where: {
        id: itemId,
      },
      data: {
        lineNumber:
          input.lineNumber,
        type:
          input.type,
        description:
          input.description,
        quantity:
          input.quantity,
        unit:
          input.unit,
        specification:
          input.specification,
        estimatedUnitPrice:
          input.estimatedUnitPrice,
        estimatedTotal:
          input.estimatedTotal,
        requiredByDate:
          input.requiredByDate,
        deliveryLocation:
          input.deliveryLocation,
        notes:
          input.notes,
      },
      select:
        procurementRequestItemSelect,
    });
  }

  async delete(
    transaction: ProcurementTransactionClient,
    procurementRequestId: string,
    itemId: string,
  ): Promise<boolean> {
    const result =
      await transaction.procurementRequestItem.deleteMany({
        where: {
          id: itemId,
          procurementRequestId,
        },
      });

    return result.count > 0;
  }

  async deleteByRequestId(
    transaction: ProcurementTransactionClient,
    procurementRequestId: string,
  ): Promise<number> {
    const result =
      await transaction.procurementRequestItem.deleteMany({
        where: {
          procurementRequestId,
        },
      });

    return result.count;
  }
}
