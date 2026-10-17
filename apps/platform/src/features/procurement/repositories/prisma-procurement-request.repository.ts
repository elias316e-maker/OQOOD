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
  ApproveProcurementRequestAuditInput,
  ArchiveProcurementRequestAuditInput,
  CancelProcurementRequestAuditInput,
  CreateProcurementRequestAuditInput,
  ProcurementRequestRepository,
  ProcurementTransactionClient,
  RejectProcurementRequestAuditInput,
  RequestProcurementChangesAuditInput,
  StartProcurementReviewAuditInput,
  SubmitProcurementRequestAuditInput,
  UpdateProcurementRequestAuditInput,
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

  async createUpdateAuditLog(
    transaction: ProcurementTransactionClient,
    input: UpdateProcurementRequestAuditInput,
  ): Promise<void> {
    await transaction.auditLog.create({
      data: {
        workspaceId: input.workspaceId,
        userId: input.actorUserId,
        action: "procurement.updated",
        entityType: "ProcurementRequest",
        entityId: input.procurementRequestId,
        metadata: {
          number:
            input.procurementRequestNumber,
          changedFields: input.changedFields,
          itemCount: input.itemCount,
          source:
            "PROCUREMENT_APPLICATION_SERVICE",
        },
      },
    });
  }

  async createSubmitAuditLog(
    transaction: ProcurementTransactionClient,
    input: SubmitProcurementRequestAuditInput,
  ): Promise<void> {
    await transaction.auditLog.create({
      data: {
        workspaceId: input.workspaceId,
        userId: input.actorUserId,
        action: "procurement.submitted",
        entityType: "ProcurementRequest",
        entityId: input.procurementRequestId,
        metadata: {
          number:
            input.procurementRequestNumber,
          previousStatus:
            input.previousStatus,
          itemCount: input.itemCount,
          submittedAt:
            input.submittedAt.toISOString(),
          source:
            "PROCUREMENT_APPLICATION_SERVICE",
        },
      },
    });
  }

  async createStartReviewAuditLog(
    transaction: ProcurementTransactionClient,
    input: StartProcurementReviewAuditInput,
  ): Promise<void> {
    await transaction.auditLog.create({
      data: {
        workspaceId: input.workspaceId,
        userId: input.actorUserId,
        action: "procurement.review_started",
        entityType: "ProcurementRequest",
        entityId: input.procurementRequestId,
        metadata: {
          number:
            input.procurementRequestNumber,
          previousStatus:
            input.previousStatus,
          reviewStartedAt:
            input.reviewStartedAt.toISOString(),
          source:
            "PROCUREMENT_APPLICATION_SERVICE",
        },
      },
    });
  }

  async createRequestChangesAuditLog(
    transaction: ProcurementTransactionClient,
    input: RequestProcurementChangesAuditInput,
  ): Promise<void> {
    await transaction.auditLog.create({
      data: {
        workspaceId: input.workspaceId,
        userId: input.actorUserId,
        action:
          "procurement.changes_requested",
        entityType: "ProcurementRequest",
        entityId: input.procurementRequestId,
        metadata: {
          number:
            input.procurementRequestNumber,
          previousStatus:
            input.previousStatus,
          reason: input.reason,
          changesRequestedAt:
            input.changesRequestedAt.toISOString(),
          source:
            "PROCUREMENT_APPLICATION_SERVICE",
        },
      },
    });
  }

  async createApproveAuditLog(
    transaction: ProcurementTransactionClient,
    input: ApproveProcurementRequestAuditInput,
  ): Promise<void> {
    await transaction.auditLog.create({
      data: {
        workspaceId: input.workspaceId,
        userId: input.actorUserId,
        action: "procurement.approved",
        entityType: "ProcurementRequest",
        entityId: input.procurementRequestId,
        metadata: {
          number:
            input.procurementRequestNumber,
          previousStatus:
            input.previousStatus,
          reason: input.reason,
          approvedAt:
            input.approvedAt.toISOString(),
          source:
            "PROCUREMENT_APPLICATION_SERVICE",
        },
      },
    });
  }

  async createRejectAuditLog(
    transaction: ProcurementTransactionClient,
    input: RejectProcurementRequestAuditInput,
  ): Promise<void> {
    await transaction.auditLog.create({
      data: {
        workspaceId: input.workspaceId,
        userId: input.actorUserId,
        action: "procurement.rejected",
        entityType: "ProcurementRequest",
        entityId: input.procurementRequestId,
        metadata: {
          number:
            input.procurementRequestNumber,
          previousStatus:
            input.previousStatus,
          reason: input.reason,
          rejectedAt:
            input.rejectedAt.toISOString(),
          source:
            "PROCUREMENT_APPLICATION_SERVICE",
        },
      },
    });
  }

  async createCancelAuditLog(
    transaction: ProcurementTransactionClient,
    input: CancelProcurementRequestAuditInput,
  ): Promise<void> {
    await transaction.auditLog.create({
      data: {
        workspaceId: input.workspaceId,
        userId: input.actorUserId,
        action: "procurement.cancelled",
        entityType: "ProcurementRequest",
        entityId: input.procurementRequestId,
        metadata: {
          number:
            input.procurementRequestNumber,
          previousStatus:
            input.previousStatus,
          reason: input.reason,
          cancelledAt:
            input.cancelledAt.toISOString(),
          source:
            "PROCUREMENT_APPLICATION_SERVICE",
        },
      },
    });
  }

  async createArchiveAuditLog(
    transaction: ProcurementTransactionClient,
    input: ArchiveProcurementRequestAuditInput,
  ): Promise<void> {
    await transaction.auditLog.create({
      data: {
        workspaceId: input.workspaceId,
        userId: input.actorUserId,
        action: "procurement.archived",
        entityType: "ProcurementRequest",
        entityId: input.procurementRequestId,
        metadata: {
          number:
            input.procurementRequestNumber,
          previousStatus:
            input.previousStatus,
          reason: input.reason,
          archivedAt:
            input.archivedAt.toISOString(),
          source:
            "PROCUREMENT_APPLICATION_SERVICE",
        },
      },
    });
  }
}
