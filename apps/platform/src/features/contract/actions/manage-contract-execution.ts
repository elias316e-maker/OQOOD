"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { Permissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { PrismaOpportunityAuthorizationGateway } from "@/features/opportunity/authorization";
import { resolveOpportunityActionContext } from "@/features/opportunity/actions";

type Result = { success: true; message: string } | { success: false; message: string };
const refresh = (id: string) => revalidatePath(`/platform/contracts/${id}`);

export async function createContractMilestoneAction(input: {
  contractId: string; title: string; description?: string; dueDate?: string; amount?: string;
}): Promise<Result> {
  try {
    const title = input.title.trim();
    if (title.length < 3) throw new Error("عنوان المرحلة قصير جداً.");
    const amount = new Prisma.Decimal(input.amount?.trim() || "0");
    if (amount.isNegative()) throw new Error("قيمة المرحلة لا يمكن أن تكون سالبة.");
    const context = await resolveOpportunityActionContext();
    const authorization = new PrismaOpportunityAuthorizationGateway();
    await prisma.$transaction(async (transaction) => {
      await authorization.authorize(transaction, {
        workspaceId: context.workspaceId, actorUserId: context.actorUserId,
        permission: Permissions.contracts.update, requireWriteAccess: true,
      });
      const contract = await transaction.contract.findFirst({
        where: { id: input.contractId, workspaceId: context.workspaceId, status: "ACTIVE" },
      });
      if (!contract) throw new Error("يمكن إضافة مراحل إلى العقد الساري فقط.");
      const total = await transaction.contractMilestone.aggregate({
        where: { contractId: contract.id }, _sum: { amount: true }, _max: { number: true },
      });
      if (amount.add(total._sum.amount ?? 0).greaterThan(contract.totalAmount)) {
        throw new Error("إجمالي قيم المراحل يتجاوز قيمة العقد.");
      }
      const milestone = await transaction.contractMilestone.create({
        data: {
          contractId: contract.id, number: (total._max.number ?? 0) + 1, title,
          description: input.description?.trim() || null,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          amount, createdById: context.actorUserId,
        },
      });
      await transaction.auditLog.create({
        data: {
          workspaceId: context.workspaceId, userId: context.actorUserId,
          action: "contract.milestone_created", entityType: "Contract", entityId: contract.id,
          metadata: { milestoneId: milestone.id, milestoneNumber: milestone.number, amount: amount.toString() },
        },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    refresh(input.contractId);
    return { success: true, message: "تمت إضافة مرحلة التنفيذ." };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "تعذر إضافة المرحلة." };
  }
}

export async function updateContractMilestoneAction(input: {
  contractId: string; milestoneId: string;
  command: "START" | "PROGRESS" | "SUBMIT" | "ACCEPT" | "REJECT" | "CLAIM" | "PAY";
  progress?: number; reason?: string;
}): Promise<Result> {
  try {
    const context = await resolveOpportunityActionContext();
    const authorization = new PrismaOpportunityAuthorizationGateway();
    await prisma.$transaction(async (transaction) => {
      await authorization.authorize(transaction, {
        workspaceId: context.workspaceId, actorUserId: context.actorUserId,
        permission: ["ACCEPT", "REJECT"].includes(input.command)
          ? Permissions.contracts.approve : Permissions.contracts.update,
        requireWriteAccess: true,
      });
      const milestone = await transaction.contractMilestone.findFirst({
        where: { id: input.milestoneId, contractId: input.contractId, contract: { workspaceId: context.workspaceId, status: "ACTIVE" } },
      });
      if (!milestone) throw new Error("لم يتم العثور على المرحلة في عقد ساري.");
      let data: Prisma.ContractMilestoneUpdateInput;
      if (input.command === "START" && milestone.status === "PLANNED") {
        data = { status: "IN_PROGRESS", startedAt: new Date() };
      } else if (input.command === "PROGRESS" && milestone.status === "IN_PROGRESS") {
        const progress = Number(input.progress);
        if (!Number.isInteger(progress) || progress < 0 || progress > 100) throw new Error("نسبة الإنجاز غير صالحة.");
        data = { progress };
      } else if (input.command === "SUBMIT" && milestone.status === "IN_PROGRESS" && milestone.progress === 100) {
        data = { status: "SUBMITTED", submittedAt: new Date() };
      } else if (input.command === "ACCEPT" && milestone.status === "SUBMITTED") {
        data = { status: "ACCEPTED", acceptedAt: new Date() };
      } else if (input.command === "REJECT" && milestone.status === "SUBMITTED" && input.reason?.trim()) {
        data = { status: "IN_PROGRESS", rejectionReason: input.reason.trim() };
      } else if (input.command === "CLAIM" && milestone.status === "ACCEPTED" && milestone.paymentStatus === "NOT_CLAIMED") {
        data = { paymentStatus: "CLAIMED", claimedAt: new Date() };
      } else if (input.command === "PAY" && milestone.paymentStatus === "CLAIMED") {
        data = { paymentStatus: "PAID", paidAt: new Date() };
      } else {
        throw new Error("لا يمكن تنفيذ الإجراء في حالة المرحلة الحالية.");
      }
      await transaction.contractMilestone.update({ where: { id: milestone.id }, data });
      await transaction.auditLog.create({
        data: {
          workspaceId: context.workspaceId, userId: context.actorUserId,
          action: `contract.milestone_${input.command.toLowerCase()}`,
          entityType: "Contract", entityId: input.contractId,
          metadata: { milestoneId: milestone.id, milestoneNumber: milestone.number, progress: input.progress, reason: input.reason?.trim() },
        },
      });
    });
    refresh(input.contractId);
    return { success: true, message: "تم تحديث مرحلة التنفيذ." };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "تعذر تحديث المرحلة." };
  }
}
