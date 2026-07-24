import type { Prisma } from "@/generated/prisma/client";
import type {
  ArchiveOpportunityAuditInput,
  CreateOpportunityAuditInput,
  CreateOpportunityRecordInput,
  OpportunityListFilters,
  OpportunityListInput,
  OpportunityRecord,
  OpportunityRepository,
  OpportunityTransactionClient,
  PublishOpportunityAuditInput,
  UpdateOpportunityAuditInput,
  UpdateOpportunityRecordInput,
} from "./opportunity.repository";

const opportunitySelect = {
  id: true,
  workspaceId: true,
  projectId: true,
  number: true,
  title: true,
  description: true,
  type: true,
  status: true,
  visibility: true,
  category: true,
  priority: true,
  budget: true,
  currency: true,
  issueDate: true,
  closingDate: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
  closedAt: true,
} satisfies Prisma.OpportunitySelect;

function buildOpportunityWhere(
  workspaceId: string,
  filters?: OpportunityListFilters,
): Prisma.OpportunityWhereInput {
  const search = filters?.search?.trim();

  return {
    workspaceId,
    ...(filters?.status
      ? { status: filters.status }
      : {}),
    ...(filters?.type
      ? { type: filters.type }
      : {}),
    ...(filters?.visibility
      ? { visibility: filters.visibility }
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

export class PrismaOpportunityRepository
  implements OpportunityRepository
{
  async findById(
    transaction: OpportunityTransactionClient,
    workspaceId: string,
    opportunityId: string,
  ): Promise<OpportunityRecord | null> {
    return transaction.opportunity.findFirst({
      where: {
        id: opportunityId,
        workspaceId,
      },
      select: opportunitySelect,
    });
  }

  async findByNumber(
    transaction: OpportunityTransactionClient,
    workspaceId: string,
    number: string,
  ): Promise<OpportunityRecord | null> {
    return transaction.opportunity.findUnique({
      where: {
        workspaceId_number: {
          workspaceId,
          number,
        },
      },
      select: opportunitySelect,
    });
  }

  async listByWorkspace(
    transaction: OpportunityTransactionClient,
    input: OpportunityListInput,
  ): Promise<OpportunityRecord[]> {
    const limit = Math.min(
      Math.max(input.limit ?? 50, 1),
      100,
    );

    const offset = Math.max(input.offset ?? 0, 0);

    return transaction.opportunity.findMany({
      where: buildOpportunityWhere(
        input.workspaceId,
        input.filters,
      ),
      select: opportunitySelect,
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
    transaction: OpportunityTransactionClient,
    workspaceId: string,
    filters?: OpportunityListFilters,
  ): Promise<number> {
    return transaction.opportunity.count({
      where: buildOpportunityWhere(
        workspaceId,
        filters,
      ),
    });
  }

  async create(
    transaction: OpportunityTransactionClient,
    input: CreateOpportunityRecordInput,
  ): Promise<OpportunityRecord> {
    return transaction.opportunity.create({
      data: {
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        number: input.number,
        title: input.title,
        description: input.description,
        type: input.type,
        status: input.status,
        visibility: input.visibility,
        category: input.category,
        priority: input.priority,
        budget: input.budget,
        currency: input.currency,
        issueDate: input.issueDate,
        closingDate: input.closingDate,
        createdById: input.createdById,
      },
      select: opportunitySelect,
    });
  }

  async update(
    transaction: OpportunityTransactionClient,
    workspaceId: string,
    opportunityId: string,
    input: UpdateOpportunityRecordInput,
  ): Promise<OpportunityRecord | null> {
    const existing =
      await transaction.opportunity.findFirst({
        where: {
          id: opportunityId,
          workspaceId,
        },
        select: {
          id: true,
        },
      });

    if (!existing) {
      return null;
    }

    return transaction.opportunity.update({
      where: {
        id: existing.id,
      },
      data: input,
      select: opportunitySelect,
    });
  }

  async createAuditLog(
    transaction: OpportunityTransactionClient,
    input: CreateOpportunityAuditInput,
  ): Promise<void> {
    await transaction.auditLog.create({
      data: {
        workspaceId: input.workspaceId,
        userId: input.actorUserId,
        action: "opportunity.created",
        entityType: "Opportunity",
        entityId: input.opportunityId,
        metadata: {
          number: input.opportunityNumber,
          type: input.opportunityType,
          visibility: input.visibility,
          source: "OPPORTUNITY_APPLICATION_SERVICE",
        },
      },
    });
  }


  async createUpdateAuditLog(
    transaction: OpportunityTransactionClient,
    input: UpdateOpportunityAuditInput,
  ): Promise<void> {
    await transaction.auditLog.create({
      data: {
        workspaceId: input.workspaceId,
        userId: input.actorUserId,
        action: "opportunity.updated",
        entityType: "Opportunity",
        entityId: input.opportunityId,
        metadata: {
          number: input.opportunityNumber,
          changedFields: input.changedFields,
          source: "OPPORTUNITY_APPLICATION_SERVICE",
        },
      },
    });
  }


  async createPublishAuditLog(
    transaction: OpportunityTransactionClient,
    input: PublishOpportunityAuditInput,
  ): Promise<void> {
    await transaction.auditLog.create({
      data: {
        workspaceId: input.workspaceId,
        userId: input.actorUserId,
        action: "opportunity.published",
        entityType: "Opportunity",
        entityId: input.opportunityId,
        metadata: {
          number: input.opportunityNumber,
          previousStatus: input.previousStatus,
          targetStatus: "PUBLISHED",
          publishedAt:
            input.publishedAt.toISOString(),
          source:
            "OPPORTUNITY_APPLICATION_SERVICE",
        },
      },
    });
  }


  async createArchiveAuditLog(
    transaction: OpportunityTransactionClient,
    input: ArchiveOpportunityAuditInput,
  ): Promise<void> {
    await transaction.auditLog.create({
      data: {
        workspaceId: input.workspaceId,
        userId: input.actorUserId,
        action: "opportunity.archived",
        entityType: "Opportunity",
        entityId: input.opportunityId,
        metadata: {
          number: input.opportunityNumber,
          previousStatus: input.previousStatus,
          targetStatus: "ARCHIVED",
          archivedAt:
            input.archivedAt.toISOString(),
          source:
            "OPPORTUNITY_APPLICATION_SERVICE",
        },
      },
    });
  }
}
