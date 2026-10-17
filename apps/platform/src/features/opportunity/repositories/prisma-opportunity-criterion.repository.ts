import {
  Prisma,
} from "@/generated/prisma/client";

import type {
  CreateOpportunityCriterionInput,
  OpportunityCriterionAuditInput,
  OpportunityCriterionRecord,
  OpportunityCriterionRepository,
  UpdateOpportunityCriterionAuditInput,
  UpdateOpportunityCriterionInput,
} from "./opportunity-criterion.repository";

import type {
  OpportunityTransactionClient,
} from "./opportunity.repository";

const criterionSelect = {
  id: true,
  opportunityId: true,
  name: true,
  description: true,
  category: true,
  scoringMethod: true,
  weight: true,
  minimumScore: true,
  required: true,
  active: true,
  displayOrder: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.OpportunityCriterionSelect;

export class PrismaOpportunityCriterionRepository
  implements OpportunityCriterionRepository
{
  async listByOpportunity(
    transaction: OpportunityTransactionClient,
    opportunityId: string,
  ): Promise<OpportunityCriterionRecord[]> {
    return transaction.opportunityCriterion.findMany({
      where: {
        opportunityId,
      },
      select: criterionSelect,
      orderBy: [
        {
          displayOrder: "asc",
        },
        {
          createdAt: "asc",
        },
        {
          id: "asc",
        },
      ],
    });
  }

  async findById(
    transaction: OpportunityTransactionClient,
    criterionId: string,
  ): Promise<OpportunityCriterionRecord | null> {
    return transaction.opportunityCriterion.findUnique({
      where: {
        id: criterionId,
      },
      select: criterionSelect,
    });
  }

  async findByName(
    transaction: OpportunityTransactionClient,
    opportunityId: string,
    name: string,
  ): Promise<OpportunityCriterionRecord | null> {
    return transaction.opportunityCriterion.findUnique({
      where: {
        opportunityId_name: {
          opportunityId,
          name,
        },
      },
      select: criterionSelect,
    });
  }

  async create(
    transaction: OpportunityTransactionClient,
    input: CreateOpportunityCriterionInput,
  ): Promise<OpportunityCriterionRecord> {
    return transaction.opportunityCriterion.create({
      data: {
        opportunityId: input.opportunityId,
        name: input.name,
        description: input.description,
        category: input.category,
        scoringMethod: input.scoringMethod,
        weight: input.weight,
        minimumScore: input.minimumScore,
        required: input.required,
        active: input.active,
        displayOrder: input.displayOrder,
      },
      select: criterionSelect,
    });
  }

  async update(
    transaction: OpportunityTransactionClient,
    criterionId: string,
    input: UpdateOpportunityCriterionInput,
  ): Promise<OpportunityCriterionRecord | null> {
    const existing =
      await transaction.opportunityCriterion.findUnique({
        where: {
          id: criterionId,
        },
        select: {
          id: true,
        },
      });

    if (!existing) {
      return null;
    }

    return transaction.opportunityCriterion.update({
      where: {
        id: existing.id,
      },
      data: input,
      select: criterionSelect,
    });
  }

  async delete(
    transaction: OpportunityTransactionClient,
    criterionId: string,
  ): Promise<void> {
    await transaction.opportunityCriterion.delete({
      where: {
        id: criterionId,
      },
    });
  }

  async calculateTotalWeight(
    transaction: OpportunityTransactionClient,
    opportunityId: string,
  ): Promise<Prisma.Decimal> {
    const result =
      await transaction.opportunityCriterion.aggregate({
        where: {
          opportunityId,
          active: true,
        },
        _sum: {
          weight: true,
        },
      });

    return result._sum.weight ?? new Prisma.Decimal(0);
  }

  async createAuditLog(
    transaction: OpportunityTransactionClient,
    input: OpportunityCriterionAuditInput,
  ): Promise<void> {
    await transaction.auditLog.create({
      data: {
        workspaceId: input.workspaceId,
        userId: input.actorUserId,
        action: "opportunity.criterion.created",
        entityType: "OpportunityCriterion",
        entityId: input.criterionId,
        metadata: {
          opportunityId: input.opportunityId,
          criterionName: input.criterionName,
          source: "OPPORTUNITY_CRITERION_APPLICATION_SERVICE",
        },
      },
    });
  }

  async createUpdateAuditLog(
    transaction: OpportunityTransactionClient,
    input: UpdateOpportunityCriterionAuditInput,
  ): Promise<void> {
    await transaction.auditLog.create({
      data: {
        workspaceId: input.workspaceId,
        userId: input.actorUserId,
        action: "opportunity.criterion.updated",
        entityType: "OpportunityCriterion",
        entityId: input.criterionId,
        metadata: {
          opportunityId: input.opportunityId,
          criterionName: input.criterionName,
          changedFields: input.changedFields,
          source: "OPPORTUNITY_CRITERION_APPLICATION_SERVICE",
        },
      },
    });
  }

  async createDeleteAuditLog(
    transaction: OpportunityTransactionClient,
    input: OpportunityCriterionAuditInput,
  ): Promise<void> {
    await transaction.auditLog.create({
      data: {
        workspaceId: input.workspaceId,
        userId: input.actorUserId,
        action: "opportunity.criterion.deleted",
        entityType: "OpportunityCriterion",
        entityId: input.criterionId,
        metadata: {
          opportunityId: input.opportunityId,
          criterionName: input.criterionName,
          source: "OPPORTUNITY_CRITERION_APPLICATION_SERVICE",
        },
      },
    });
  }

}
