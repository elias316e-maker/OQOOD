import {
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
  CompleteFinancialEvaluationRequest,
  FinancialEvaluationResponse,
  GetFinancialEvaluationRequest,
  RecommendFinancialAwardRequest,
} from "../dtos";

import {
  OpportunityNotFoundError,
  OpportunityValidationError,
} from "../errors";

import {
  PrismaFinancialEvaluationRepository,
  type FinancialEvaluationOfferRecord,
  type FinancialEvaluationOpportunityRecord,
  type FinancialEvaluationRepository,
} from "../repositories";

import {
  completeFinancialEvaluationSchema,
  getFinancialEvaluationSchema,
  recommendFinancialAwardSchema,
} from "../validators";

import type {
  FinancialEvaluationApplicationService,
} from "./financial-evaluation-application.service";

type FinancialEvaluationTransactionRunner = Pick<
  PrismaClient,
  "$transaction"
>;

function calculateVariancePercentage(
  amount: number,
  lowestAmount: number,
): string {
  if (lowestAmount <= 0) {
    return "0.00";
  }

  return (
    ((amount - lowestAmount) / lowestAmount) *
    100
  ).toFixed(2);
}

function mapResponse(
  opportunity: FinancialEvaluationOpportunityRecord,
  offers: FinancialEvaluationOfferRecord[],
): FinancialEvaluationResponse {
  const rankedOffers = [...offers].sort((first, second) => {
    const amountDifference =
      Number(first.totalAmount) -
      Number(second.totalAmount);

    if (amountDifference !== 0) {
      return amountDifference;
    }

    return first.offerId.localeCompare(
      second.offerId,
    );
  });

  const lowestOffer =
    rankedOffers[0] ?? null;

  const lowestAmount = lowestOffer
    ? Number(lowestOffer.totalAmount)
    : 0;

  const recommendedOfferId =
    lowestOffer?.offerId ?? null;

  return {
    opportunity: {
      id: opportunity.id,
      number: opportunity.number,
      title: opportunity.title,
      currency: opportunity.currency,
      status: opportunity.status,
    },
    offers: rankedOffers.map((offer, index) => ({
      offerId: offer.offerId,
      partnerName: offer.partnerName,
      referenceNumber:
        offer.referenceNumber,
      currency: offer.currency,
      subtotal: offer.subtotal,
      taxAmount: offer.taxAmount,
      totalAmount: offer.totalAmount,
      deliveryDays: offer.deliveryDays,
      validityDays: offer.validityDays,
      paymentTerms: offer.paymentTerms,
      commercialNotes:
        offer.commercialNotes,
      priceVariancePercentage:
        calculateVariancePercentage(
          Number(offer.totalAmount),
          lowestAmount,
        ),
      rank: index + 1,
      recommended:
        offer.offerId === recommendedOfferId,
      status: offer.status,
    })),
    summary: {
      eligibleOffersCount:
        rankedOffers.length,
      evaluatedOffersCount:
        rankedOffers.filter(
          (offer) =>
            offer.status ===
            "FINANCIALLY_EVALUATED",
        ).length,
      lowestOfferId:
        lowestOffer?.offerId ?? null,
      recommendedOfferId,
    },
  };
}

export class DefaultFinancialEvaluationApplicationService
  implements FinancialEvaluationApplicationService
{
  constructor(
    private readonly repository:
      FinancialEvaluationRepository =
        new PrismaFinancialEvaluationRepository(),

    private readonly authorization:
      OpportunityAuthorizationGateway =
        new PrismaOpportunityAuthorizationGateway(),

    private readonly transactionRunner:
      FinancialEvaluationTransactionRunner = prisma,
  ) {}

  async get(
    request: GetFinancialEvaluationRequest,
  ): Promise<FinancialEvaluationResponse> {
    const validation =
      getFinancialEvaluationSchema.safeParse(
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
              workspaceId:
                input.workspaceId,
              actorUserId:
                input.actorUserId,
              permission:
                Permissions.opportunities.read,
              requireWriteAccess: false,
            },
          );

        const opportunity =
          await this.repository.findOpportunity(
            transaction,
            authorized.workspaceId,
            input.opportunityId,
          );

        if (!opportunity) {
          throw new OpportunityNotFoundError(
            input.opportunityId,
          );
        }

        const offers =
          await this.repository.listEligibleOffers(
            transaction,
            opportunity.id,
          );

        return mapResponse(
          opportunity,
          offers,
        );
      },
    );
  }

  async complete(
    request: CompleteFinancialEvaluationRequest,
  ): Promise<FinancialEvaluationResponse> {
    const validation =
      completeFinancialEvaluationSchema.safeParse(
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
              workspaceId:
                input.workspaceId,
              actorUserId:
                input.actorUserId,
              permission:
                Permissions.opportunities.evaluate,
              requireWriteAccess: true,
            },
          );

        const opportunity =
          await this.repository.findOpportunity(
            transaction,
            authorized.workspaceId,
            input.opportunityId,
          );

        if (!opportunity) {
          throw new OpportunityNotFoundError(
            input.opportunityId,
          );
        }

        const offers =
          await this.repository.listEligibleOffers(
            transaction,
            opportunity.id,
          );

        const pendingOfferIds = offers
          .filter(
            (offer) =>
              offer.status ===
              "TECHNICALLY_ACCEPTED",
          )
          .map((offer) => offer.offerId);

        if (offers.length === 0) {
          throw new Error(
            "لا توجد عروض مقبولة فنيًا لإجراء التقييم المالي.",
          );
        }

        await this.repository
          .markOffersFinanciallyEvaluated(
            transaction,
            opportunity.id,
            pendingOfferIds,
          );

        await this.repository.updateOpportunityStatus(
          transaction,
          opportunity.id,
          "FINANCIAL_EVALUATION",
        );

        await this.repository
          .createFinancialEvaluationAuditLog(
            transaction,
            {
              workspaceId:
                authorized.workspaceId,
              actorUserId:
                authorized.actorUserId,
              opportunityId:
                opportunity.id,
              action:
                "opportunity.financial_evaluation.completed",
              metadata: {
                eligibleOfferIds: offers.map(
                  (offer) => offer.offerId,
                ),
                newlyEvaluatedOfferIds:
                  pendingOfferIds,
                eligibleOffersCount:
                  offers.length,
              },
            },
          );

        const updatedOpportunity = {
          ...opportunity,
          status:
            "FINANCIAL_EVALUATION",
        };

        const updatedOffers = offers.map(
          (offer) => ({
            ...offer,
            status:
              offer.status ===
              "TECHNICALLY_ACCEPTED"
                ? "FINANCIALLY_EVALUATED"
                : offer.status,
          }),
        );

        return mapResponse(
          updatedOpportunity,
          updatedOffers,
        );
      },
    );
  }

  async recommendAward(
    request: RecommendFinancialAwardRequest,
  ): Promise<FinancialEvaluationResponse> {
    const validation =
      recommendFinancialAwardSchema.safeParse(
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
              workspaceId:
                input.workspaceId,
              actorUserId:
                input.actorUserId,
              permission:
                Permissions.opportunities.award,
              requireWriteAccess: true,
            },
          );

        const opportunity =
          await this.repository.findOpportunity(
            transaction,
            authorized.workspaceId,
            input.opportunityId,
          );

        if (!opportunity) {
          throw new OpportunityNotFoundError(
            input.opportunityId,
          );
        }

        const offers =
          await this.repository.listEligibleOffers(
            transaction,
            opportunity.id,
          );

        const financiallyEvaluatedOffers =
          offers.filter(
            (offer) =>
              offer.status ===
              "FINANCIALLY_EVALUATED",
          );

        if (
          financiallyEvaluatedOffers.length === 0
        ) {
          throw new Error(
            "يجب إكمال التقييم المالي قبل إنشاء توصية الترسية.",
          );
        }

        const rankedResponse = mapResponse(
          opportunity,
          financiallyEvaluatedOffers,
        );

        const recommendedOfferId =
          rankedResponse.summary
            .recommendedOfferId;

        if (!recommendedOfferId) {
          throw new Error(
            "تعذر تحديد العرض الموصى به للترسية.",
          );
        }

        await this.repository.updateOpportunityStatus(
          transaction,
          opportunity.id,
          "AWARD_PENDING",
        );

        await this.repository
          .createFinancialEvaluationAuditLog(
            transaction,
            {
              workspaceId:
                authorized.workspaceId,
              actorUserId:
                authorized.actorUserId,
              opportunityId:
                opportunity.id,
              action:
                "opportunity.award.recommended",
              metadata: {
                recommendedOfferId,
                rankedOfferIds:
                  rankedResponse.offers.map(
                    (offer) =>
                      offer.offerId,
                  ),
                lowestOfferId:
                  rankedResponse.summary
                    .lowestOfferId,
                eligibleOffersCount:
                  rankedResponse.summary
                    .eligibleOffersCount,
              },
            },
          );

        return {
          ...rankedResponse,
          opportunity: {
            ...rankedResponse.opportunity,
            status: "AWARD_PENDING",
          },
        };
      },
    );
  }
}
