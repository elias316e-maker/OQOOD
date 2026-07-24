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

import type {
  CreateProcurementRequestAuditInput,
  ProcurementRequestRepository,
  ProcurementTransactionClient,
} from "./procurement-request.repository";

const procurementRequestSelect = {
  id: true,
  workspaceId: true,
  projectId: true,
  number: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  category: true,
  requiredByDate: true,
  currency: true,
  estimatedTotal: true,
  requestedById: true,
  assignedToId: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProcurementRequestSelect;

function buildProcurementRequestWhere(
  workspaceId: string,
  filters?: ProcurementRequestListFilters,
): Prisma.ProcurementRequestWhereInput {
  const search = filters?.search?.trim();

  return {
    workspaceId,

    ...(filters?.status !== undefined
      ? {
          status: filters.status,
        }
      : {}),

    ...(filters?.priority !== undefined
      ? {
          priority: filters.priority,
        }
      : {}),

    ...(filters?.projectId !== undefined
      ? {
          projectId: filters.projectId,
        }
      : {}),

    ...(filters?.requestedById !== undefined
      ? {
          requestedById:
            filters.requestedById,
        }
      : {}),

    ...(filters?.assignedToId !== undefined
      ? {
          assignedToId:
            filters.assignedToId,
        }
      : {}),

    ...(filters?.category !== undefined
      ? {
          category: {
            equals: filters.category,
            mode: "insensitive",
          },
        }
      : {}),

    ...(filters?.requiredByFrom !== undefined ||
    filters?.requiredByTo !== undefined
      ? {
          requiredByDate: {
            ...(filters.requiredByFrom !==
            undefined
              ? {
                  gte:
                    filters.requiredByFrom,
                }
              : {}),

            ...(filters.requiredByTo !==
            undefined
              ? {
                  lte:
                    filters.requiredByTo,
                }
              : {}),
          },
        }
      : {}),

    ...(search
      ? {
          OR: [
            {
              number: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              title: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              description: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
  };
}

export class PrismaProcurementRequestRepository
  implements ProcurementRequestRepository
{
  async findById(
    transaction: ProcurementTransactionClient,
    workspaceId: string,
    procurementRequestId: string,
  ): Promise<ProcurementRequestRecord | null> {
    return transaction.procurementRequest.findFirst({
      where: {
        id: procurementRequestId,
        workspaceId,
      },
      select: procurementRequestSelect,
    });
  }

  async findByNumber(
    transaction: ProcurementTransactionClient,
    workspaceId: string,
    number: string,
  ): Promise<ProcurementRequestRecord | null> {
    return transaction.procurementRequest.findUnique({
      where: {
        workspaceId_number: {
          workspaceId,
          number,
        },
      },
      select: procurementRequestSelect,
    });
  }

  async existsByNumber(
    transaction: ProcurementTransactionClient,
    workspaceId: string,
    number: string,
  ): Promise<boolean> {
    const request =
      await transaction.procurementRequest.findUnique({
        where: {
          workspaceId_number: {
            workspaceId,
            number,
          },
        },
        select: {
          id: true,
        },
      });

    return request !== null;
  }

  async listByWorkspace(
    transaction: ProcurementTransactionClient,
    input: ProcurementRequestListInput,
  ): Promise<ProcurementRequestRecord[]> {
    const limit = Math.max(
      1,
      Math.min(input.limit ?? 20, 100),
    );

    const offset = Math.max(
      0,
      input.offset ?? 0,
    );

    return transaction.procurementRequest.findMany({
      where: buildProcurementRequestWhere(
        input.workspaceId,
        input.filters,
      ),
      select: procurementRequestSelect,
      orderBy: [
        {
          createdAt: "desc",
        },
        {
          id: "desc",
        },
      ],
      take: limit,
      skip: offset,
    });
  }

  async countByWorkspace(
    transaction: ProcurementTransactionClient,
    workspaceId: string,
    filters?: ProcurementRequestListFilters,
  ): Promise<number> {
    return transaction.procurementRequest.count({
      where: buildProcurementRequestWhere(
        workspaceId,
        filters,
      ),
    });
  }

  async create(
    transaction: ProcurementTransactionClient,
    input: CreateProcurementRequestRecordInput,
  ): Promise<ProcurementRequestRecord> {
    return transaction.procurementRequest.create({
      data: {
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        number: input.number,
        title: input.title,
        description: input.description,
        status: input.status,
        priority: input.priority,
        category: input.category,
        requiredByDate:
          input.requiredByDate,
        currency: input.currency,
        estimatedTotal:
          input.estimatedTotal,
        requestedById:
          input.requestedById,
        assignedToId:
          input.assignedToId,
        createdById:
          input.createdById,
      },
      select: procurementRequestSelect,
    });
  }

  async update(
    transaction: ProcurementTransactionClient,
    workspaceId: string,
    procurementRequestId: string,
    input: UpdateProcurementRequestRecordInput,
  ): Promise<ProcurementRequestRecord | null> {
    const existing =
      await transaction.procurementRequest.findFirst({
        where: {
          id: procurementRequestId,
          workspaceId,
        },
        select: {
          id: true,
        },
      });

    if (!existing) {
      return null;
    }

    return transaction.procurementRequest.update({
      where: {
        id: procurementRequestId,
      },
      data: {
        projectId: input.projectId,
        title: input.title,
        description: input.description,
        status: input.status,
        priority: input.priority,
        category: input.category,
        requiredByDate: input.requiredByDate,
        currency: input.currency,
        estimatedTotal: input.estimatedTotal,
        requestedById: input.requestedById,
        assignedToId: input.assignedToId,
      },
      select: procurementRequestSelect,
    });
  }

  async createAuditLog(
    transaction: ProcurementTransactionClient,
    input: CreateProcurementRequestAuditInput,
  ): Promise<void> {
    await transaction.auditLog.create({
      data: {
        workspaceId: input.workspaceId,
        userId: input.actorUserId,
        action: "procurement.created",
        entityType: "ProcurementRequest",
        entityId: input.procurementRequestId,
        metadata: {
          number:
            input.procurementRequestNumber,
          itemCount: input.itemCount,
          source:
            "PROCUREMENT_APPLICATION_SERVICE",
        },
      },
    });
  }
}
