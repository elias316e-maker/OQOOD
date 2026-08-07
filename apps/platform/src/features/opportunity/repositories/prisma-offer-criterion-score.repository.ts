import {
  Prisma,
} from "@/generated/prisma/client";

import type {
  OfferCriterionEvaluationRow,
  OfferCriterionScoreRecord,
  OfferCriterionScoreRepository,
  OfferEvaluationContext,
  OfferEvaluationSummary,
  UpsertOfferCriterionScoreInput,
} from "./offer-criterion-score.repository";

import type {
  OpportunityTransactionClient,
} from "./opportunity.repository";

const scoreSelect = {
  id: true,
  offerId: true,
  criterionId: true,
  score: true,
  passed: true,
  notes: true,
  evaluatedById: true,
  evaluatedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.OfferCriterionScoreSelect;

export class PrismaOfferCriterionScoreRepository
  implements OfferCriterionScoreRepository
{
  async findOfferContext(
    transaction: OpportunityTransactionClient,
    workspaceId: string,
    offerId: string,
  ): Promise<OfferEvaluationContext | null> {
    const offer = await transaction.offer.findFirst({
      where: {
        id: offerId,
        opportunity: {
          workspaceId,
        },
      },
      select: {
        id: true,
        opportunityId: true,
        referenceNumber: true,
        status: true,
        opportunity: {
          select: {
            workspaceId: true,
          },
        },
        businessPartner: {
          select: {
            nameAr: true,
          },
        },
      },
    });

    if (!offer) {
      return null;
    }

    return {
      offerId: offer.id,
      opportunityId: offer.opportunityId,
      workspaceId: offer.opportunity.workspaceId,
      partnerName: offer.businessPartner.nameAr,
      referenceNumber: offer.referenceNumber,
      status: offer.status,
    };
  }

  async listEvaluationRows(
    transaction: OpportunityTransactionClient,
    offerId: string,
  ): Promise<OfferCriterionEvaluationRow[]> {
    const offer = await transaction.offer.findUnique({
      where: {
        id: offerId,
      },
      select: {
        opportunityId: true,
      },
    });

    if (!offer) {
      return [];
    }

    const criteria =
      await transaction.opportunityCriterion.findMany({
        where: {
          opportunityId: offer.opportunityId,
          active: true,
        },
        select: {
          id: true,
          name: true,
          category: true,
          scoringMethod: true,
          weight: true,
          minimumScore: true,
          required: true,
          active: true,
          displayOrder: true,
          offerScores: {
            where: {
              offerId,
            },
            select: scoreSelect,
            take: 1,
          },
        },
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

    return criteria.map((criterion) => ({
      criterionId: criterion.id,
      criterionName: criterion.name,
      category: criterion.category,
      scoringMethod: criterion.scoringMethod,
      weight: criterion.weight,
      minimumScore: criterion.minimumScore,
      required: criterion.required,
      active: criterion.active,
      displayOrder: criterion.displayOrder,
      scoreRecord: criterion.offerScores[0] ?? null,
    }));
  }

  async listByOffer(
    transaction: OpportunityTransactionClient,
    offerId: string,
  ): Promise<OfferCriterionScoreRecord[]> {
    return transaction.offerCriterionScore.findMany({
      where: {
        offerId,
      },
      select: scoreSelect,
      orderBy: [
        {
          criterion: {
            displayOrder: "asc",
          },
        },
        {
          createdAt: "asc",
        },
      ],
    });
  }

  async findByOfferAndCriterion(
    transaction: OpportunityTransactionClient,
    offerId: string,
    criterionId: string,
  ): Promise<OfferCriterionScoreRecord | null> {
    return transaction.offerCriterionScore.findUnique({
      where: {
        offerId_criterionId: {
          offerId,
          criterionId,
        },
      },
      select: scoreSelect,
    });
  }

  async upsert(
    transaction: OpportunityTransactionClient,
    input: UpsertOfferCriterionScoreInput,
  ): Promise<OfferCriterionScoreRecord> {
    return transaction.offerCriterionScore.upsert({
      where: {
        offerId_criterionId: {
          offerId: input.offerId,
          criterionId: input.criterionId,
        },
      },
      create: {
        offerId: input.offerId,
        criterionId: input.criterionId,
        score: input.score,
        passed: input.passed,
        notes: input.notes,
        evaluatedById: input.evaluatedById,
        evaluatedAt: input.evaluatedAt ?? new Date(),
      },
      update: {
        score: input.score,
        passed: input.passed,
        notes: input.notes,
        evaluatedById: input.evaluatedById,
        evaluatedAt: input.evaluatedAt ?? new Date(),
      },
      select: scoreSelect,
    });
  }

  async deleteByOfferAndCriterion(
    transaction: OpportunityTransactionClient,
    offerId: string,
    criterionId: string,
  ): Promise<void> {
    await transaction.offerCriterionScore.deleteMany({
      where: {
        offerId,
        criterionId,
      },
    });
  }

  async deleteByOffer(
    transaction: OpportunityTransactionClient,
    offerId: string,
  ): Promise<void> {
    await transaction.offerCriterionScore.deleteMany({
      where: {
        offerId,
      },
    });
  }

  async calculateOfferEvaluation(
    transaction: OpportunityTransactionClient,
    offerId: string,
  ): Promise<OfferEvaluationSummary> {
    const offer = await transaction.offer.findUnique({
      where: {
        id: offerId,
      },
      select: {
        id: true,
        opportunityId: true,
      },
    });

    if (!offer) {
      return {
        offerId,
        totalWeightedScore: new Prisma.Decimal(0),
        evaluatedWeight: new Prisma.Decimal(0),
        totalActiveWeight: new Prisma.Decimal(0),
        requiredCriteriaCount: 0,
        passedRequiredCriteriaCount: 0,
        failedRequiredCriteriaCount: 0,
        completedCriteriaCount: 0,
        totalCriteriaCount: 0,
        complete: false,
        passed: false,
      };
    }

    const criteria =
      await transaction.opportunityCriterion.findMany({
        where: {
          opportunityId: offer.opportunityId,
          active: true,
        },
        select: {
          id: true,
          scoringMethod: true,
          weight: true,
          minimumScore: true,
          required: true,
          offerScores: {
            where: {
              offerId,
            },
            select: {
              score: true,
              passed: true,
            },
            take: 1,
          },
        },
        orderBy: {
          displayOrder: "asc",
        },
      });

    let totalWeightedScore = new Prisma.Decimal(0);
    let evaluatedWeight = new Prisma.Decimal(0);
    let totalActiveWeight = new Prisma.Decimal(0);

    let requiredCriteriaCount = 0;
    let passedRequiredCriteriaCount = 0;
    let failedRequiredCriteriaCount = 0;
    let completedCriteriaCount = 0;

    for (const criterion of criteria) {
      totalActiveWeight =
        totalActiveWeight.add(criterion.weight);

      if (criterion.required) {
        requiredCriteriaCount += 1;
      }

      const evaluation = criterion.offerScores[0];

      if (!evaluation) {
        continue;
      }

      const completed =
        criterion.scoringMethod === "PASS_FAIL"
          ? evaluation.passed !== null
          : evaluation.score !== null;

      if (!completed) {
        continue;
      }

      completedCriteriaCount += 1;
      evaluatedWeight =
        evaluatedWeight.add(criterion.weight);

      let criterionPassed = true;

      if (criterion.scoringMethod === "PASS_FAIL") {
        criterionPassed =
          evaluation.passed === true;

        if (criterionPassed) {
          totalWeightedScore =
            totalWeightedScore.add(
              criterion.weight,
            );
        }
      } else {
        const normalizedScore =
          evaluation.score ?? new Prisma.Decimal(0);

        const cappedScore = Prisma.Decimal.min(
          Prisma.Decimal.max(
            normalizedScore,
            new Prisma.Decimal(0),
          ),
          new Prisma.Decimal(100),
        );

        totalWeightedScore =
          totalWeightedScore.add(
            cappedScore
              .mul(criterion.weight)
              .div(100),
          );

        if (criterion.minimumScore !== null) {
          criterionPassed =
            cappedScore.greaterThanOrEqualTo(
              criterion.minimumScore,
            );
        }
      }

      if (criterion.required) {
        if (criterionPassed) {
          passedRequiredCriteriaCount += 1;
        } else {
          failedRequiredCriteriaCount += 1;
        }
      }
    }

    const totalCriteriaCount = criteria.length;

    const complete =
      totalCriteriaCount > 0 &&
      completedCriteriaCount === totalCriteriaCount;

    const passed =
      complete &&
      failedRequiredCriteriaCount === 0;

    return {
      offerId,
      totalWeightedScore,
      evaluatedWeight,
      totalActiveWeight,
      requiredCriteriaCount,
      passedRequiredCriteriaCount,
      failedRequiredCriteriaCount,
      completedCriteriaCount,
      totalCriteriaCount,
      complete,
      passed,
    };
  }

  async updateOfferStatus(
    transaction: OpportunityTransactionClient,
    offerId: string,
    status:
      | "UNDER_REVIEW"
      | "TECHNICALLY_ACCEPTED"
      | "TECHNICALLY_REJECTED",
  ): Promise<void> {
    await transaction.offer.update({
      where: {
        id: offerId,
      },
      data: {
        status,
      },
    });
  }

  async createEvaluationAuditLog(
    transaction: OpportunityTransactionClient,
    input: {
      workspaceId: string;
      actorUserId: string;
      opportunityId: string;
      offerId: string;
      criterionId?: string;
      action:
        | "offer.criterion.scored"
        | "offer.evaluation.completed";
      metadata?: Record<string, unknown>;
    },
  ): Promise<void> {
    await transaction.auditLog.create({
      data: {
        workspaceId: input.workspaceId,
        userId: input.actorUserId,
        action: input.action,
        entityType: "Offer",
        entityId: input.offerId,
        metadata: {
          opportunityId: input.opportunityId,
          offerId: input.offerId,
          ...(input.criterionId
            ? {
                criterionId: input.criterionId,
              }
            : {}),
          ...(input.metadata ?? {}),
          source:
            "OFFER_EVALUATION_APPLICATION_SERVICE",
        },
      },
    });
  }

}
