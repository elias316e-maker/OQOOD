import type {
  PrismaClient,
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
} from "@/features/opportunity/authorization";

import type {
  CreateContractFromAwardRequest,
  CreateContractFromAwardResponse,
} from "../dtos";

import {
  PrismaContractAwardRepository,
  type ContractAwardRepository,
} from "../repositories";

import {
  createContractFromAwardSchema,
} from "../validators";

import type {
  ContractAwardApplicationService,
} from "./contract-award-application.service";

type ContractAwardTransactionRunner = Pick<
  PrismaClient,
  "$transaction"
>;

export class DefaultContractAwardApplicationService
  implements ContractAwardApplicationService
{
  constructor(
    private readonly repository:
      ContractAwardRepository =
        new PrismaContractAwardRepository(),

    private readonly authorization:
      OpportunityAuthorizationGateway =
        new PrismaOpportunityAuthorizationGateway(),

    private readonly transactionRunner:
      ContractAwardTransactionRunner = prisma,
  ) {}

  async createFromAward(
    request: CreateContractFromAwardRequest,
  ): Promise<CreateContractFromAwardResponse> {
    const validation =
      createContractFromAwardSchema.safeParse(
        request,
      );

    if (!validation.success) {
      throw new Error(
        validation.error.issues[0]?.message ??
          "بيانات إنشاء العقد غير صحيحة.",
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
                Permissions.contracts.create,
              requireWriteAccess: true,
            },
          );

        const opportunity =
          await this.repository.findAwardedOpportunity(
            transaction,
            authorized.workspaceId,
            input.opportunityId,
          );

        if (!opportunity) {
          throw new Error(
            "لا يمكن إنشاء عقد قبل ترسية المنافسة.",
          );
        }

        const winningOffer =
          await this.repository.findWinningOffer(
            transaction,
            opportunity.id,
          );

        if (!winningOffer) {
          throw new Error(
            "لم يتم العثور على العرض الفائز.",
          );
        }

        const existing =
          await this.repository.findExistingContract(
            transaction,
            winningOffer.id,
          );

        if (existing) {
          return {
            contractId:
              existing.id,
            contractNumber:
              existing.number,
            created:
              false,
          };
        }

        const contractNumber =
          `CTR-${opportunity.number}`;

        const contract =
          await this.repository.createDraftContract(
            transaction,
            {
              workspaceId:
                authorized.workspaceId,
              projectId:
                opportunity.projectId,
              opportunityId:
                opportunity.id,
              sourceOfferId:
                winningOffer.id,
              businessPartnerId:
                winningOffer.businessPartnerId,
              number:
                contractNumber,
              title:
                `عقد: ${opportunity.title}`,
              description:
                opportunity.description,
              currency:
                winningOffer.currency,
              subtotal:
                winningOffer.subtotal,
              taxAmount:
                winningOffer.taxAmount,
              totalAmount:
                winningOffer.totalAmount,
              paymentTerms:
                winningOffer.paymentTerms,
              deliveryDays:
                winningOffer.deliveryDays,
              createdById:
                authorized.actorUserId,
              items:
                winningOffer.items,
            },
          );

        await this.repository.createAuditLog(
          transaction,
          {
            workspaceId:
              authorized.workspaceId,
            actorUserId:
              authorized.actorUserId,
            contractId:
              contract.id,
            contractNumber:
              contract.number,
            opportunityId:
              opportunity.id,
            opportunityNumber:
              opportunity.number,
            sourceOfferId:
              winningOffer.id,
            businessPartnerId:
              winningOffer.businessPartnerId,
          },
        );

        return {
          contractId:
            contract.id,
          contractNumber:
            contract.number,
          created:
            true,
        };
      },
    );
  }
}
