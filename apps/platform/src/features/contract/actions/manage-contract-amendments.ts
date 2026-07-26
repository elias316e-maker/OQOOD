"use server";

import { revalidatePath } from "next/cache";

import { Prisma } from "@/generated/prisma/client";
import { Permissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { PrismaOpportunityAuthorizationGateway } from "@/features/opportunity/authorization";
import { resolveOpportunityActionContext } from "@/features/opportunity/actions";

type Result<T = undefined> =
  | { success: true; data: T; message: string }
  | { success: false; message: string };

function refresh(contractId: string) {
  revalidatePath("/platform/contracts");
  revalidatePath(`/platform/contracts/${contractId}`);
}

export async function createContractAmendmentAction(input: {
  contractId: string;
  title: string;
  reason: string;
  valueChange?: string;
  newEndDate?: string;
}): Promise<Result<{ amendmentId: string }>> {
  try {
    const title = input.title.trim();
    const reason = input.reason.trim();
    if (title.length < 3 || reason.length < 5) {
      throw new Error("أدخل عنواناً وسبباً واضحين للملحق.");
    }
    const valueChange = new Prisma.Decimal(input.valueChange?.trim() || "0");
    const newEndDate = input.newEndDate ? new Date(input.newEndDate) : null;
    const context = await resolveOpportunityActionContext();
    const authorization = new PrismaOpportunityAuthorizationGateway();

    const amendment = await prisma.$transaction(
      async (transaction) => {
        await authorization.authorize(transaction, {
          workspaceId: context.workspaceId,
          actorUserId: context.actorUserId,
          permission: Permissions.contracts.update,
          requireWriteAccess: true,
        });
        const contract = await transaction.contract.findFirst({
          where: {
            id: input.contractId,
            workspaceId: context.workspaceId,
            status: { in: ["ACTIVE", "SUSPENDED"] },
          },
          include: { items: { orderBy: { lineNumber: "asc" } } },
        });
        if (!contract) throw new Error("يمكن إنشاء الملحق للعقد الساري أو الموقوف فقط.");
        if (newEndDate && contract.startDate && newEndDate < contract.startDate) {
          throw new Error("تاريخ الانتهاء الجديد يسبق تاريخ بدء العقد.");
        }
        const latest = await transaction.contractAmendment.findFirst({
          where: { contractId: contract.id },
          orderBy: { number: "desc" },
          select: { number: true },
        });
        const resultingTotal = contract.totalAmount.add(valueChange);
        if (resultingTotal.isNegative()) {
          throw new Error("لا يمكن أن تصبح قيمة العقد سالبة.");
        }
        const created = await transaction.contractAmendment.create({
          data: {
            contractId: contract.id,
            number: (latest?.number ?? 0) + 1,
            title,
            reason,
            valueChange,
            previousTotal: contract.totalAmount,
            resultingTotal,
            previousEndDate: contract.endDate,
            newEndDate,
            createdById: context.actorUserId,
            contractSnapshot: {
              number: contract.number,
              title: contract.title,
              status: contract.status,
              currency: contract.currency,
              subtotal: contract.subtotal.toString(),
              taxAmount: contract.taxAmount.toString(),
              totalAmount: contract.totalAmount.toString(),
              startDate: contract.startDate?.toISOString() ?? null,
              endDate: contract.endDate?.toISOString() ?? null,
              paymentTerms: contract.paymentTerms,
              deliveryDays: contract.deliveryDays,
              items: contract.items.map((item) => ({
                lineNumber: item.lineNumber,
                description: item.description,
                quantity: item.quantity.toString(),
                unit: item.unit,
                unitPrice: item.unitPrice.toString(),
                totalPrice: item.totalPrice.toString(),
              })),
            },
          },
          select: { id: true, number: true },
        });
        await transaction.auditLog.create({
          data: {
            workspaceId: context.workspaceId,
            userId: context.actorUserId,
            action: "contract.amendment_created",
            entityType: "Contract",
            entityId: contract.id,
            metadata: { amendmentId: created.id, amendmentNumber: created.number },
          },
        });
        return created;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    refresh(input.contractId);
    return {
      success: true,
      data: { amendmentId: amendment.id },
      message: "تم إنشاء مسودة الملحق.",
    };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "تعذر إنشاء الملحق." };
  }
}

export async function transitionContractAmendmentAction(input: {
  contractId: string;
  amendmentId: string;
  command: "SUBMIT" | "APPROVE" | "REJECT";
  reason?: string;
}): Promise<Result> {
  try {
    const context = await resolveOpportunityActionContext();
    const authorization = new PrismaOpportunityAuthorizationGateway();
    await prisma.$transaction(async (transaction) => {
      await authorization.authorize(transaction, {
        workspaceId: context.workspaceId,
        actorUserId: context.actorUserId,
        permission:
          input.command === "SUBMIT"
            ? Permissions.contracts.update
            : Permissions.contracts.approve,
        requireWriteAccess: true,
      });
      const amendment = await transaction.contractAmendment.findFirst({
        where: {
          id: input.amendmentId,
          contractId: input.contractId,
          contract: { workspaceId: context.workspaceId },
        },
        include: { contract: true },
      });
      if (!amendment) throw new Error("لم يتم العثور على الملحق.");

      const expected = input.command === "SUBMIT" ? "DRAFT" : "PENDING_APPROVAL";
      if (amendment.status !== expected) {
        throw new Error("لا يمكن تنفيذ الإجراء في حالة الملحق الحالية.");
      }
      if (input.command === "REJECT" && !input.reason?.trim()) {
        throw new Error("سبب رفض الملحق مطلوب.");
      }

      const target =
        input.command === "SUBMIT"
          ? "PENDING_APPROVAL"
          : input.command === "APPROVE"
            ? "APPROVED"
            : "REJECTED";
      await transaction.contractAmendment.update({
        where: { id: amendment.id },
        data: {
          status: target,
          ...(input.command === "SUBMIT" ? { submittedAt: new Date() } : {}),
          ...(input.command === "APPROVE"
            ? { approvedAt: new Date(), approvedById: context.actorUserId }
            : {}),
          ...(input.command === "REJECT"
            ? { rejectionReason: input.reason?.trim() }
            : {}),
        },
      });
      if (input.command === "APPROVE") {
        await transaction.contract.update({
          where: { id: amendment.contractId },
          data: {
            totalAmount: amendment.resultingTotal,
            ...(amendment.newEndDate ? { endDate: amendment.newEndDate } : {}),
          },
        });
      }
      await transaction.auditLog.create({
        data: {
          workspaceId: context.workspaceId,
          userId: context.actorUserId,
          action: `contract.amendment_${input.command.toLowerCase()}`,
          entityType: "Contract",
          entityId: amendment.contractId,
          metadata: {
            amendmentId: amendment.id,
            amendmentNumber: amendment.number,
            previousStatus: amendment.status,
            targetStatus: target,
            reason: input.reason?.trim(),
            valueChange: amendment.valueChange.toString(),
          },
        },
      });
    });
    refresh(input.contractId);
    return {
      success: true,
      data: undefined,
      message:
        input.command === "SUBMIT"
          ? "تم إرسال الملحق للاعتماد."
          : input.command === "APPROVE"
            ? "تم اعتماد الملحق وتطبيق أثره على العقد."
            : "تم رفض الملحق.",
    };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "تعذر تحديث الملحق." };
  }
}
