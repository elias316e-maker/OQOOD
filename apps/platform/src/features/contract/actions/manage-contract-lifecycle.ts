"use server";

import { revalidatePath } from "next/cache";

import type { ContractStatus } from "@/generated/prisma/client";
import {
  Permissions,
  type PermissionCode,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

import { PrismaOpportunityAuthorizationGateway } from "@/features/opportunity/authorization";
import { resolveOpportunityActionContext } from "@/features/opportunity/actions";

export type ContractLifecycleCommand =
  | "SUBMIT_FOR_APPROVAL"
  | "APPROVE"
  | "SEND_FOR_SIGNATURE"
  | "ACTIVATE"
  | "SUSPEND"
  | "RESUME"
  | "COMPLETE"
  | "TERMINATE";

type Result =
  | { success: true; data: { status: ContractStatus }; message: string }
  | { success: false; message: string };

const transitions: Record<
  ContractLifecycleCommand,
  {
    from: ContractStatus[];
    to: ContractStatus;
    permission: PermissionCode;
    message: string;
    reasonRequired?: boolean;
  }
> = {
  SUBMIT_FOR_APPROVAL: {
    from: ["DRAFT"],
    to: "PENDING_APPROVAL",
    permission: Permissions.contracts.update,
    message: "تم إرسال مسودة العقد للاعتماد.",
  },
  APPROVE: {
    from: ["PENDING_APPROVAL"],
    to: "APPROVED",
    permission: Permissions.contracts.approve,
    message: "تم اعتماد العقد.",
  },
  SEND_FOR_SIGNATURE: {
    from: ["APPROVED"],
    to: "SENT_FOR_SIGNATURE",
    permission: Permissions.contracts.sign,
    message: "تم إرسال العقد للتوقيع.",
  },
  ACTIVATE: {
    from: ["SENT_FOR_SIGNATURE"],
    to: "ACTIVE",
    permission: Permissions.contracts.sign,
    message: "تم توثيق التوقيع وتفعيل العقد.",
  },
  SUSPEND: {
    from: ["ACTIVE"],
    to: "SUSPENDED",
    permission: Permissions.contracts.update,
    message: "تم إيقاف العقد مؤقتاً.",
    reasonRequired: true,
  },
  RESUME: {
    from: ["SUSPENDED"],
    to: "ACTIVE",
    permission: Permissions.contracts.update,
    message: "تم استئناف العقد.",
  },
  COMPLETE: {
    from: ["ACTIVE"],
    to: "COMPLETED",
    permission: Permissions.contracts.update,
    message: "تم إكمال العقد.",
  },
  TERMINATE: {
    from: ["ACTIVE", "SUSPENDED"],
    to: "TERMINATED",
    permission: Permissions.contracts.update,
    message: "تم إنهاء العقد.",
    reasonRequired: true,
  },
};

export async function manageContractLifecycleAction(
  contractId: string,
  command: ContractLifecycleCommand,
  reason?: string,
): Promise<Result> {
  try {
    const transition = transitions[command];
    if (!transition) throw new Error("إجراء العقد غير صالح.");
    const normalizedReason = reason?.trim();
    if (transition.reasonRequired && !normalizedReason) {
      throw new Error("يجب إدخال سبب واضح لتنفيذ هذا الإجراء.");
    }

    const context = await resolveOpportunityActionContext();
    const authorization = new PrismaOpportunityAuthorizationGateway();
    const result = await prisma.$transaction(async (transaction) => {
      await authorization.authorize(transaction, {
        workspaceId: context.workspaceId,
        actorUserId: context.actorUserId,
        permission: transition.permission,
        requireWriteAccess: true,
      });

      const contract = await transaction.contract.findFirst({
        where: { id: contractId, workspaceId: context.workspaceId },
        select: { id: true, number: true, status: true },
      });
      if (!contract) throw new Error("لم يتم العثور على العقد.");
      if (!transition.from.includes(contract.status)) {
        throw new Error("لا يمكن تنفيذ الإجراء في حالة العقد الحالية.");
      }

      const updated = await transaction.contract.updateMany({
        where: {
          id: contract.id,
          workspaceId: context.workspaceId,
          status: { in: transition.from },
        },
        data: {
          status: transition.to,
          ...(command === "ACTIVATE" ? { startDate: new Date() } : {}),
          ...(command === "SUSPEND"
            ? {
                suspendedAt: new Date(),
                suspensionReason: normalizedReason,
              }
            : {}),
          ...(command === "COMPLETE" ? { completedAt: new Date() } : {}),
          ...(command === "TERMINATE"
            ? {
                terminatedAt: new Date(),
                terminationReason: normalizedReason,
              }
            : {}),
        },
      });
      if (updated.count !== 1) {
        throw new Error("تغيرت حالة العقد، يرجى تحديث الصفحة والمحاولة مجدداً.");
      }

      await transaction.auditLog.create({
        data: {
          workspaceId: context.workspaceId,
          userId: context.actorUserId,
          action: `contract.${command.toLowerCase()}`,
          entityType: "Contract",
          entityId: contract.id,
          metadata: {
            contractNumber: contract.number,
            previousStatus: contract.status,
            targetStatus: transition.to,
            command,
            reason: normalizedReason,
          },
        },
      });

      return { status: transition.to };
    });

    revalidatePath("/platform/contracts");
    revalidatePath(`/platform/contracts/${contractId}`);
    return { success: true, data: result, message: transition.message };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "تعذر تحديث حالة العقد.",
    };
  }
}
