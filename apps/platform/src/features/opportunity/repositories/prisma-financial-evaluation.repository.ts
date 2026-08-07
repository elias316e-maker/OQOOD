import type {
  FinancialEvaluationAuditInput,
  FinancialEvaluationOfferRecord,
  FinancialEvaluationOpportunityRecord,
  FinancialEvaluationRepository,
} from "./financial-evaluation.repository";

import type {
  OpportunityTransactionClient,
} from "./opportunity.repository";

export class PrismaFinancialEvaluationRepository
  implements FinancialEvaluationRepository
{
  async findOpportunity(
    transaction: OpportunityTransactionClient,
    workspaceId: string,
    opportunityId: string,
  ): Promise<FinancialEvaluationOpportunityRecord | null> {
    const opportunity =
      await transaction.opportunity.findFirst({
        where: {
          id: opportunityId,
          workspaceId,
        },
        select: {
          id: true,
          workspaceId: true,
          number: true,
          title: true,
          currency: true,
          status: true,
        },
      });

    if (!opportunity) {
      return null;
    }

    return {
      id: opportunity.id,
      workspaceId: opportunity.workspaceId,
      number: opportunity.number,
      title: opportunity.title,
      currency: opportunity.currency,
      status: opportunity.status,
    };
  }

  async listEligibleOffers(
    transaction: OpportunityTransactionClient,
    opportunityId: string,
  ): Promise<FinancialEvaluationOfferRecord[]> {
    const offers = await transaction.offer.findMany({
      where: {
        opportunityId,
        status: {
          in: [
            "TECHNICALLY_ACCEPTED",
            "FINANCIALLY_EVALUATED",
          ],
        },
      },
      select: {
        id: true,
        opportunityId: true,
        referenceNumber: true,
        status: true,
        currency: true,
        subtotal: true,
        taxAmount: true,
        totalAmount: true,
        deliveryDays: true,
        validityDays: true,
        paymentTerms: true,
        commercialNotes: true,
        businessPartner: {
          select: {
            nameAr: true,
          },
        },
      },
      orderBy: [
        {
          totalAmount: "asc",
        },
        {
          createdAt: "asc",
        },
        {
          id: "asc",
        },
      ],
    });

    return offers.map((offer) => ({
      offerId: offer.id,
      opportunityId: offer.opportunityId,
      partnerName: offer.businessPartner.nameAr,
      referenceNumber: offer.referenceNumber,
      status: offer.status,
      currency: offer.currency,
      subtotal: offer.subtotal?.toString() ?? "0",
      taxAmount: offer.taxAmount?.toString() ?? "0",
      totalAmount: offer.totalAmount?.toString() ?? "0",
      deliveryDays: offer.deliveryDays,
      validityDays: offer.validityDays,
      paymentTerms: offer.paymentTerms,
      commercialNotes: offer.commercialNotes,
    }));
  }

  async markOffersFinanciallyEvaluated(
    transaction: OpportunityTransactionClient,
    opportunityId: string,
    offerIds: string[],
  ): Promise<void> {
    if (offerIds.length === 0) {
      return;
    }

    await transaction.offer.updateMany({
      where: {
        opportunityId,
        id: {
          in: offerIds,
        },
        status: "TECHNICALLY_ACCEPTED",
      },
      data: {
        status: "FINANCIALLY_EVALUATED",
      },
    });
  }

  async updateOpportunityStatus(
    transaction: OpportunityTransactionClient,
    opportunityId: string,
    status:
      | "FINANCIAL_EVALUATION"
      | "AWARD_PENDING",
  ): Promise<void> {
    await transaction.opportunity.update({
      where: {
        id: opportunityId,
      },
      data: {
        status,
      },
    });
  }

  async createFinancialEvaluationAuditLog(
    transaction: OpportunityTransactionClient,
    input: FinancialEvaluationAuditInput,
  ): Promise<void> {
    await transaction.auditLog.create({
      data: {
        workspaceId: input.workspaceId,
        userId: input.actorUserId,
        action: input.action,
        entityType: "Opportunity",
        entityId: input.opportunityId,
        metadata: {
          opportunityId: input.opportunityId,
          ...(input.metadata ?? {}),
          source:
            "FINANCIAL_EVALUATION_APPLICATION_SERVICE",
        },
      },
    });
  }
}
