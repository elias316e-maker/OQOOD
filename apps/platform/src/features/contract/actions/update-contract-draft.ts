"use server";

import { revalidatePath } from "next/cache";

import { Permissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { PrismaOpportunityAuthorizationGateway } from "@/features/opportunity/authorization";
import {
  resolveOpportunityActionContext,
} from "@/features/opportunity/actions/helpers/resolve-opportunity-context";

export async function updateContractDraftAction(input: {
  contractId: string;
  title: string;
  description?: string;
  paymentTerms?: string;
  deliveryDays?: string;
  startDate?: string;
  endDate?: string;
}) {
  try {
    const title = input.title.trim();
    if (title.length < 3) throw new Error("عنوان العقد قصير جداً.");
    const startDate = input.startDate ? new Date(input.startDate) : null;
    const endDate = input.endDate ? new Date(input.endDate) : null;
    if (startDate && endDate && endDate < startDate) {
      throw new Error("تاريخ انتهاء العقد يجب أن يكون بعد تاريخ البدء.");
    }
    const deliveryDays = input.deliveryDays ? Number(input.deliveryDays) : null;
    if (deliveryDays !== null && (!Number.isInteger(deliveryDays) || deliveryDays < 0)) {
      throw new Error("مدة التسليم غير صالحة.");
    }

    const context = await resolveOpportunityActionContext();
    const authorization = new PrismaOpportunityAuthorizationGateway();
    await prisma.$transaction(async (transaction) => {
      await authorization.authorize(transaction, {
        workspaceId: context.workspaceId,
        actorUserId: context.actorUserId,
        permission: Permissions.contracts.update,
        requireWriteAccess: true,
      });
      const contract = await transaction.contract.findFirst({
        where: { id: input.contractId, workspaceId: context.workspaceId },
      });
      if (!contract) throw new Error("لم يتم العثور على العقد.");
      if (contract.status !== "DRAFT") {
        throw new Error("يمكن تعديل بيانات العقد أثناء حالة المسودة فقط.");
      }
      await transaction.contract.update({
        where: { id: contract.id },
        data: {
          title,
          description: input.description?.trim() || null,
          paymentTerms: input.paymentTerms?.trim() || null,
          deliveryDays,
          startDate,
          endDate,
        },
      });
      await transaction.auditLog.create({
        data: {
          workspaceId: context.workspaceId,
          userId: context.actorUserId,
          action: "contract.draft_updated",
          entityType: "Contract",
          entityId: contract.id,
          metadata: {
            previous: {
              title: contract.title,
              startDate: contract.startDate?.toISOString(),
              endDate: contract.endDate?.toISOString(),
              deliveryDays: contract.deliveryDays,
            },
            current: {
              title,
              startDate: startDate?.toISOString(),
              endDate: endDate?.toISOString(),
              deliveryDays,
            },
          },
        },
      });
    });
    revalidatePath("/platform/contracts");
    revalidatePath(`/platform/contracts/${input.contractId}`);
    return { success: true as const, message: "تم تحديث مسودة العقد." };
  } catch (error) {
    return {
      success: false as const,
      message: error instanceof Error ? error.message : "تعذر تحديث العقد.",
    };
  }
}
