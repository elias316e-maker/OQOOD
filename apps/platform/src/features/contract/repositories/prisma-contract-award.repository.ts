import type {
  AwardOpportunityRecord,
  ContractAwardRepository,
  ContractAwardTransaction,
  CreateContractAwardAuditInput,
  CreateDraftContractInput,
  ExistingContractRecord,
  WinningOfferRecord,
} from "./contract-award.repository";

export class PrismaContractAwardRepository
  implements ContractAwardRepository
{
  async findAwardedOpportunity(
    transaction: ContractAwardTransaction,
    workspaceId: string,
    opportunityId: string,
  ): Promise<AwardOpportunityRecord | null> {
    return transaction.opportunity.findFirst({
      where: {
        id: opportunityId,
        workspaceId,
        status: "AWARDED",
      },
      select: {
        id: true,
        workspaceId: true,
        projectId: true,
        number: true,
        title: true,
        description: true,
      },
    });
  }

  async findWinningOffer(
    transaction: ContractAwardTransaction,
    opportunityId: string,
  ): Promise<WinningOfferRecord | null> {
    const offer =
      await transaction.offer.findFirst({
        where: {
          opportunityId,
          status: "WINNER",
        },
        select: {
          id: true,
          businessPartnerId: true,
          currency: true,
          subtotal: true,
          taxAmount: true,
          totalAmount: true,
          paymentTerms: true,
          deliveryDays: true,
          items: {
            select: {
              quantity: true,
              unitPrice: true,
              totalPrice: true,
              notes: true,
              opportunityItem: {
                select: {
                  lineNumber: true,
                  description: true,
                  unit: true,
                },
              },
            },
            orderBy: {
              opportunityItem: {
                lineNumber: "asc",
              },
            },
          },
        },
      });

    if (!offer) {
      return null;
    }

    return {
      id: offer.id,
      businessPartnerId:
        offer.businessPartnerId,
      currency: offer.currency,
      subtotal:
        offer.subtotal?.toString() ?? "0",
      taxAmount:
        offer.taxAmount?.toString() ?? "0",
      totalAmount:
        offer.totalAmount?.toString() ?? "0",
      paymentTerms:
        offer.paymentTerms,
      deliveryDays:
        offer.deliveryDays,
      items: offer.items.map((item) => ({
        lineNumber:
          item.opportunityItem.lineNumber,
        description:
          item.opportunityItem.description,
        quantity:
          item.quantity.toString(),
        unit:
          item.opportunityItem.unit,
        unitPrice:
          item.unitPrice.toString(),
        totalPrice:
          item.totalPrice.toString(),
        notes:
          item.notes,
      })),
    };
  }

  async findExistingContract(
    transaction: ContractAwardTransaction,
    offerId: string,
  ): Promise<ExistingContractRecord | null> {
    return transaction.contract.findUnique({
      where: {
        sourceOfferId: offerId,
      },
      select: {
        id: true,
        number: true,
      },
    });
  }

  async createDraftContract(
    transaction: ContractAwardTransaction,
    input: CreateDraftContractInput,
  ): Promise<ExistingContractRecord> {
    return transaction.contract.create({
      data: {
        workspaceId:
          input.workspaceId,
        projectId:
          input.projectId,
        opportunityId:
          input.opportunityId,
        sourceOfferId:
          input.sourceOfferId,
        businessPartnerId:
          input.businessPartnerId,
        number:
          input.number,
        title:
          input.title,
        description:
          input.description,
        status: "DRAFT",
        currency:
          input.currency,
        subtotal:
          input.subtotal,
        taxAmount:
          input.taxAmount,
        totalAmount:
          input.totalAmount,
        paymentTerms:
          input.paymentTerms,
        deliveryDays:
          input.deliveryDays,
        createdById:
          input.createdById,
        items: {
          create: input.items.map((item) => ({
            lineNumber:
              item.lineNumber,
            description:
              item.description,
            quantity:
              item.quantity,
            unit:
              item.unit,
            unitPrice:
              item.unitPrice,
            totalPrice:
              item.totalPrice,
            notes:
              item.notes,
          })),
        },
      },
      select: {
        id: true,
        number: true,
      },
    });
  }

  async createAuditLog(
    transaction: ContractAwardTransaction,
    input: CreateContractAwardAuditInput,
  ): Promise<void> {
    await transaction.auditLog.create({
      data: {
        workspaceId:
          input.workspaceId,
        userId:
          input.actorUserId,
        action:
          "contract.created_from_award",
        entityType:
          "Contract",
        entityId:
          input.contractId,
        metadata: {
          contractNumber:
            input.contractNumber,
          opportunityId:
            input.opportunityId,
          opportunityNumber:
            input.opportunityNumber,
          sourceOfferId:
            input.sourceOfferId,
          businessPartnerId:
            input.businessPartnerId,
          source:
            "CONTRACT_AWARD_APPLICATION_SERVICE",
        },
      },
    });
  }
}
