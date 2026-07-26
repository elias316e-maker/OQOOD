"use server";

import { revalidatePath } from "next/cache";

import { Permissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

import { PrismaOpportunityAuthorizationGateway } from "../authorization";
import { resolveOpportunityActionContext } from "./helpers";

type Result =
  | { success: true; data: { contractId: string }; message: string }
  | { success: false; message: string };

export async function createContractFromAwardAction(
  opportunityId: string,
): Promise<Result> {
  try {
    const context = await resolveOpportunityActionContext();
    const authorization = new PrismaOpportunityAuthorizationGateway();
    const result = await prisma.$transaction(async (transaction) => {
      await authorization.authorize(transaction, {
        workspaceId: context.workspaceId,
        actorUserId: context.actorUserId,
        permission: Permissions.contracts.create,
        requireWriteAccess: true,
      });

      const opportunity = await transaction.opportunity.findFirst({
        where: { id: opportunityId, workspaceId: context.workspaceId, status: "AWARDED" },
        include: {
          offers: {
            where: { status: "WINNER" },
            include: {
              items: {
                include: { opportunityItem: true },
                orderBy: { opportunityItem: { lineNumber: "asc" } },
              },
            },
          },
        },
      });
      if (!opportunity) throw new Error("لا يمكن إنشاء عقد قبل ترسية المنافسة.");
      const winningOffer = opportunity.offers[0];
      if (!winningOffer) throw new Error("لم يتم العثور على العرض الفائز.");

      const existing = await transaction.contract.findUnique({
        where: { sourceOfferId: winningOffer.id },
        select: { id: true },
      });
      if (existing) return { contractId: existing.id, created: false };

      const contract = await transaction.contract.create({
        data: {
          workspaceId: context.workspaceId,
          projectId: opportunity.projectId,
          opportunityId: opportunity.id,
          sourceOfferId: winningOffer.id,
          businessPartnerId: winningOffer.businessPartnerId,
          number: `CTR-${opportunity.number}`,
          title: `عقد: ${opportunity.title}`,
          description: opportunity.description,
          currency: winningOffer.currency,
          subtotal: winningOffer.subtotal ?? 0,
          taxAmount: winningOffer.taxAmount ?? 0,
          totalAmount: winningOffer.totalAmount ?? 0,
          paymentTerms: winningOffer.paymentTerms,
          deliveryDays: winningOffer.deliveryDays,
          createdById: context.actorUserId,
          items: {
            create: winningOffer.items.map((item) => ({
              lineNumber: item.opportunityItem.lineNumber,
              description: item.opportunityItem.description,
              quantity: item.quantity,
              unit: item.opportunityItem.unit,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              notes: item.notes,
            })),
          },
        },
        select: { id: true, number: true },
      });

      await transaction.auditLog.create({
        data: {
          workspaceId: context.workspaceId,
          userId: context.actorUserId,
          action: "contract.created_from_award",
          entityType: "Contract",
          entityId: contract.id,
          metadata: {
            contractNumber: contract.number,
            opportunityId: opportunity.id,
            opportunityNumber: opportunity.number,
            sourceOfferId: winningOffer.id,
            businessPartnerId: winningOffer.businessPartnerId,
          },
        },
      });
      return { contractId: contract.id, created: true };
    });

    revalidatePath("/platform/contracts");
    revalidatePath(`/platform/opportunities/${opportunityId}/offers`);
    return {
      success: true,
      data: { contractId: result.contractId },
      message: result.created
        ? "تم إنشاء مسودة العقد من العرض الفائز."
        : "مسودة العقد موجودة مسبقاً، تم فتحها دون تكرار.",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "تعذر إنشاء مسودة العقد.",
    };
  }
}
