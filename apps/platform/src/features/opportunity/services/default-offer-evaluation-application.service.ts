import {
  Prisma,
  type PrismaClient,
} from "@/generated/prisma/client";

import {
  Permissions,
} from "@/lib/permissions";

import {
  prisma,
} from "@/lib/prisma";

import {
  PrismaOpportunityAuthorizationGateway,
  type OpportunityAuthorizationGateway,
} from "../authorization";

import type {
  CompleteOfferEvaluationRequest,
  GetOfferEvaluationRequest,
  OfferEvaluationResponse,
  OfferEvaluationSummaryResponse,
  SaveOfferCriterionScoreRequest,
} from "../dtos";

import {
  OfferEvaluationCriterionNotFoundError,
  OfferEvaluationImmutableError,
  OfferEvaluationIncompleteError,
  OfferEvaluationInvalidValueError,
  OfferEvaluationNotFoundError,
  OpportunityValidationError,
} from "../errors";

import {
  PrismaOfferCriterionScoreRepository,
  type OfferCriterionEvaluationRow,
  type OfferCriterionScoreRepository,
  type OfferEvaluationContext,
  type OfferEvaluationSummary,
} from "../repositories";

import {
  completeOfferEvaluationSchema,
  getOfferEvaluationSchema,
  saveOfferCriterionScoreSchema,
} from "../validators";

import type {
  OfferEvaluationApplicationService,
} from "./offer-evaluation-application.service";

type OfferEvaluationTransactionRunner = Pick<
  PrismaClient,
  "$transaction"
>;

const mutableOfferStatuses = new Set([
  "SUBMITTED",
  "UNDER_REVIEW",
]);

function mapSummary(
  summary: OfferEvaluationSummary,
): OfferEvaluationSummaryResponse {
  return {
    offerId: summary.offerId,
    totalWeightedScore:
      summary.totalWeightedScore.toString(),
    evaluatedWeight:
      summary.evaluatedWeight.toString(),
    totalActiveWeight:
      summary.totalActiveWeight.toString(),
    requiredCriteriaCount:
      summary.requiredCriteriaCount,
    passedRequiredCriteriaCount:
      summary.passedRequiredCriteriaCount,
    failedRequiredCriteriaCount:
      summary.failedRequiredCriteriaCount,
    completedCriteriaCount:
      summary.completedCriteriaCount,
    totalCriteriaCount:
      summary.totalCriteriaCount,
    complete: summary.complete,
    passed: summary.passed,
  };
}

function mapResponse(
  offer: OfferEvaluationContext,
  rows: OfferCriterionEvaluationRow[],
  summary: OfferEvaluationSummary,
): OfferEvaluationResponse {
  return {
    offer: {
      id: offer.offerId,
      opportunityId: offer.opportunityId,
      partnerName: offer.partnerName,
      referenceNumber: offer.referenceNumber,
      status: offer.status,
    },
    scores: rows.map((row) => ({
      id: row.scoreRecord?.id ?? "",
      offerId: offer.offerId,
      criterionId: row.criterionId,
      criterionName: row.criterionName,
      category: row.category,
      scoringMethod: row.scoringMethod,
      weight: row.weight.toString(),
      minimumScore:
        row.minimumScore?.toString() ?? null,
      required: row.required,
      score:
        row.scoreRecord?.score?.toString() ?? null,
      passed:
        row.scoreRecord?.passed ?? null,
      notes:
        row.scoreRecord?.notes ?? null,
      evaluatedById:
        row.scoreRecord?.evaluatedById ?? "",
      evaluatedAt:
        row.scoreRecord?.evaluatedAt.toISOString() ??
        "",
    })),
    summary: mapSummary(summary),
  };
}

export class DefaultOfferEvaluationApplicationService
  implements OfferEvaluationApplicationService
{
  constructor(
    private readonly repository:
      OfferCriterionScoreRepository =
        new PrismaOfferCriterionScoreRepository(),

    private readonly authorization:
      OpportunityAuthorizationGateway =
        new PrismaOpportunityAuthorizationGateway(),

    private readonly transactionRunner:
      OfferEvaluationTransactionRunner = prisma,
  ) {}

  async get(
    request: GetOfferEvaluationRequest,
  ): Promise<OfferEvaluationResponse> {
    const validation =
      getOfferEvaluationSchema.safeParse(request);

    if (!validation.success) {
      throw new OpportunityValidationError(
        validation.error.flatten(),
      );
    }

    const input = validation.data;

    return this.transactionRunner.$transaction(
      async (transaction) => {
        const authorized =
          await this.authorization.authorize(
            transaction,
            {
              workspaceId: input.workspaceId,
              actorUserId: input.actorUserId,
              permission:
                Permissions.opportunities.read,
              requireWriteAccess: false,
            },
          );

        const offer =
          await this.repository.findOfferContext(
            transaction,
            authorized.workspaceId,
            input.offerId,
          );

        if (!offer) {
          throw new OfferEvaluationNotFoundError(
            input.offerId,
          );
        }

        const [rows, summary] =
          await Promise.all([
            this.repository.listEvaluationRows(
              transaction,
              offer.offerId,
            ),
            this.repository.calculateOfferEvaluation(
              transaction,
              offer.offerId,
            ),
          ]);

        return mapResponse(
          offer,
          rows,
          summary,
        );
      },
    );
  }

  async saveScore(
    request: SaveOfferCriterionScoreRequest,
  ): Promise<OfferEvaluationResponse> {
    const validation =
      saveOfferCriterionScoreSchema.safeParse(
        request,
      );

    if (!validation.success) {
      throw new OpportunityValidationError(
        validation.error.flatten(),
      );
    }

    const input = validation.data;

    return this.transactionRunner.$transaction(
      async (transaction) => {
        const authorized =
          await this.authorization.authorize(
            transaction,
            {
              workspaceId: input.workspaceId,
              actorUserId: input.actorUserId,
              permission:
                Permissions.opportunities.evaluate,
              requireWriteAccess: true,
            },
          );

        const offer =
          await this.repository.findOfferContext(
            transaction,
            authorized.workspaceId,
            input.offerId,
          );

        if (!offer) {
          throw new OfferEvaluationNotFoundError(
            input.offerId,
          );
        }

        this.assertMutableOffer(offer.status);

        const rows =
          await this.repository.listEvaluationRows(
            transaction,
            offer.offerId,
          );

        const criterion = rows.find(
          (row) =>
            row.criterionId === input.criterionId,
        );

        if (!criterion) {
          throw new OfferEvaluationCriterionNotFoundError(
            input.criterionId,
          );
        }

        let score: Prisma.Decimal | null = null;
        let passed: boolean | null = null;

        if (
          criterion.scoringMethod === "PASS_FAIL"
        ) {
          if (typeof input.passed !== "boolean") {
            throw new OfferEvaluationInvalidValueError(
              "يجب تحديد نجاح أو رسوب لهذا المعيار.",
            );
          }

          passed = input.passed;
        } else {
          if (input.score === null) {
            throw new OfferEvaluationInvalidValueError(
              "يجب إدخال درجة رقمية لهذا المعيار.",
            );
          }

          score = new Prisma.Decimal(input.score);

          passed =
            criterion.minimumScore === null
              ? true
              : score.greaterThanOrEqualTo(
                  criterion.minimumScore,
                );
        }

        await this.repository.upsert(
          transaction,
          {
            offerId: offer.offerId,
            criterionId:
              criterion.criterionId,
            score,
            passed,
            notes: input.notes ?? null,
            evaluatedById:
              authorized.actorUserId,
            evaluatedAt: new Date(),
          },
        );

        if (offer.status === "SUBMITTED") {
          await this.repository.updateOfferStatus(
            transaction,
            offer.offerId,
            "UNDER_REVIEW",
          );
        }

        await this.repository.createEvaluationAuditLog(
          transaction,
          {
            workspaceId:
              authorized.workspaceId,
            actorUserId:
              authorized.actorUserId,
            opportunityId:
              offer.opportunityId,
            offerId: offer.offerId,
            criterionId:
              criterion.criterionId,
            action: "offer.criterion.scored",
            metadata: {
              scoringMethod:
                criterion.scoringMethod,
              score: score?.toString() ?? null,
              passed,
            },
          },
        );

        const [updatedRows, summary] =
          await Promise.all([
            this.repository.listEvaluationRows(
              transaction,
              offer.offerId,
            ),
            this.repository.calculateOfferEvaluation(
              transaction,
              offer.offerId,
            ),
          ]);

        return mapResponse(
          {
            ...offer,
            status:
              offer.status === "SUBMITTED"
                ? "UNDER_REVIEW"
                : offer.status,
          },
          updatedRows,
          summary,
        );
      },
    );
  }

  async complete(
    request: CompleteOfferEvaluationRequest,
  ): Promise<OfferEvaluationResponse> {
    const validation =
      completeOfferEvaluationSchema.safeParse(
        request,
      );

    if (!validation.success) {
      throw new OpportunityValidationError(
        validation.error.flatten(),
      );
    }

    const input = validation.data;

    return this.transactionRunner.$transaction(
      async (transaction) => {
        const authorized =
          await this.authorization.authorize(
            transaction,
            {
              workspaceId: input.workspaceId,
              actorUserId: input.actorUserId,
              permission:
                Permissions.opportunities.evaluate,
              requireWriteAccess: true,
            },
          );

        const offer =
          await this.repository.findOfferContext(
            transaction,
            authorized.workspaceId,
            input.offerId,
          );

        if (!offer) {
          throw new OfferEvaluationNotFoundError(
            input.offerId,
          );
        }

        this.assertMutableOffer(offer.status);

        const summary =
          await this.repository.calculateOfferEvaluation(
            transaction,
            offer.offerId,
          );

        if (!summary.complete) {
          throw new OfferEvaluationIncompleteError(
            summary.completedCriteriaCount,
            summary.totalCriteriaCount,
          );
        }

        const targetStatus = summary.passed
          ? "TECHNICALLY_ACCEPTED"
          : "TECHNICALLY_REJECTED";

        await this.repository.updateOfferStatus(
          transaction,
          offer.offerId,
          targetStatus,
        );

        await this.repository.createEvaluationAuditLog(
          transaction,
          {
            workspaceId:
              authorized.workspaceId,
            actorUserId:
              authorized.actorUserId,
            opportunityId:
              offer.opportunityId,
            offerId: offer.offerId,
            action:
              "offer.evaluation.completed",
            metadata: {
              targetStatus,
              totalWeightedScore:
                summary.totalWeightedScore.toString(),
              evaluatedWeight:
                summary.evaluatedWeight.toString(),
              failedRequiredCriteriaCount:
                summary.failedRequiredCriteriaCount,
              passed: summary.passed,
            },
          },
        );

        const rows =
          await this.repository.listEvaluationRows(
            transaction,
            offer.offerId,
          );

        return mapResponse(
          {
            ...offer,
            status: targetStatus,
          },
          rows,
          summary,
        );
      },
    );
  }

  private assertMutableOffer(
    status: string,
  ): void {
    if (!mutableOfferStatuses.has(status)) {
      throw new OfferEvaluationImmutableError(
        status,
      );
    }
  }
}
