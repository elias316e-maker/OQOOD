"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { Permissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { PrismaOpportunityAuthorizationGateway } from "@/features/opportunity/authorization";
import {
  resolveOpportunityActionContext,
} from "@/features/opportunity/actions/helpers/resolve-opportunity-context";

export async function evaluateContractPartnerAction(input: {
  contractId: string;
  timelinessScore: number;
  qualityScore: number;
  responsivenessScore: number;
  financialScore: number;
  notes?: string;
}) {
  try {
    const scores = [
      input.timelinessScore, input.qualityScore,
      input.responsivenessScore, input.financialScore,
    ].map(Number);
    if (scores.some((score) => !Number.isInteger(score) || score < 1 || score > 5)) {
      throw new Error("يجب أن تكون جميع الدرجات بين 1 و5.");
    }
    const overallScore = new Prisma.Decimal(scores.reduce((sum, score) => sum + score, 0)).div(4);
    const context = await resolveOpportunityActionContext();
    const authorization = new PrismaOpportunityAuthorizationGateway();
    await prisma.$transaction(async (transaction) => {
      await authorization.authorize(transaction, {
        workspaceId: context.workspaceId,
        actorUserId: context.actorUserId,
        permission: Permissions.vendors.evaluate,
        requireWriteAccess: true,
      });
      const contract = await transaction.contract.findFirst({
        where: {
          id: input.contractId, workspaceId: context.workspaceId,
          status: { in: ["ACTIVE", "COMPLETED"] },
        },
      });
      if (!contract) throw new Error("يمكن تقييم المورد في العقد الساري أو المكتمل فقط.");
      const evaluation = await transaction.partnerEvaluation.create({
        data: {
          contractId: contract.id,
          businessPartnerId: contract.businessPartnerId,
          timelinessScore: scores[0],
          qualityScore: scores[1],
          responsivenessScore: scores[2],
          financialScore: scores[3],
          overallScore,
          notes: input.notes?.trim() || null,
          createdById: context.actorUserId,
        },
      });
      const average = await transaction.partnerEvaluation.aggregate({
        where: { businessPartnerId: contract.businessPartnerId },
        _avg: { overallScore: true },
      });
      await transaction.businessPartner.update({
        where: { id: contract.businessPartnerId },
        data: { trustScore: average._avg.overallScore?.mul(20) ?? overallScore.mul(20) },
      });
      await transaction.auditLog.create({
        data: {
          workspaceId: context.workspaceId, userId: context.actorUserId,
          action: "contract.partner_evaluated", entityType: "Contract", entityId: contract.id,
          metadata: { evaluationId: evaluation.id, businessPartnerId: contract.businessPartnerId, overallScore: overallScore.toString() },
        },
      });
    });
    revalidatePath(`/platform/contracts/${input.contractId}`);
    revalidatePath("/platform/partners");
    return { success: true as const, message: "تم حفظ تقييم المورد وتحديث مؤشر الثقة." };
  } catch (error) {
    return { success: false as const, message: error instanceof Error ? error.message : "تعذر حفظ التقييم." };
  }
}
