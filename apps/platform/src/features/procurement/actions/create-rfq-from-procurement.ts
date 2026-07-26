"use server";

import { revalidatePath } from "next/cache";

import {
  PrismaOpportunityAuthorizationGateway,
} from "@/features/opportunity/authorization";
import {
  Permissions,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

import {
  PrismaProcurementAuthorizationGateway,
} from "../authorization";
import {
  procurementActionFailure,
  procurementActionSuccess,
  type ProcurementActionResult,
} from "./action-result";
import {
  resolveProcurementActionContext,
} from "./helpers";

type CreatedRfq = {
  opportunityId: string;
  number: string;
  alreadyExists: boolean;
};

export async function createRfqFromProcurementAction(
  procurementRequestId: string,
): Promise<ProcurementActionResult<CreatedRfq>> {
  try {
    const normalizedId = procurementRequestId.trim();
    const context =
      await resolveProcurementActionContext();

    if (!normalizedId) {
      return procurementActionFailure(
        "معرف طلب المشتريات غير صالح.",
      );
    }

    const result = await prisma.$transaction(
      async (transaction) => {
        await new PrismaProcurementAuthorizationGateway()
          .authorize(transaction, {
            workspaceId: context.workspaceId,
            actorUserId: context.actorUserId,
            permission: Permissions.procurement.read,
            requireWriteAccess: false,
          });
        await new PrismaOpportunityAuthorizationGateway()
          .authorize(transaction, {
            workspaceId: context.workspaceId,
            actorUserId: context.actorUserId,
            permission: Permissions.opportunities.create,
            requireWriteAccess: true,
          });

        const request =
          await transaction.procurementRequest.findFirst({
            where: {
              id: normalizedId,
              workspaceId: context.workspaceId,
            },
            include: {
              items: {
                orderBy: { lineNumber: "asc" },
              },
            },
          });

        if (!request) {
          throw new Error("لم يتم العثور على طلب المشتريات.");
        }
        if (request.status !== "APPROVED") {
          throw new Error(
            "يجب اعتماد طلب المشتريات قبل إنشاء طلب عرض السعر.",
          );
        }
        if (request.items.length === 0) {
          throw new Error(
            "لا يمكن إنشاء طلب عرض سعر دون بنود.",
          );
        }

        const previousAudit =
          await transaction.auditLog.findFirst({
            where: {
              workspaceId: context.workspaceId,
              entityType: "ProcurementRequest",
              entityId: request.id,
              action: "procurement.rfq_created",
            },
            orderBy: { createdAt: "desc" },
          });
        const metadata =
          previousAudit?.metadata &&
          typeof previousAudit.metadata === "object" &&
          !Array.isArray(previousAudit.metadata)
            ? previousAudit.metadata
            : null;
        const previousOpportunityId =
          metadata &&
          "opportunityId" in metadata &&
          typeof metadata.opportunityId === "string"
            ? metadata.opportunityId
            : null;

        if (previousOpportunityId) {
          const existing =
            await transaction.opportunity.findFirst({
              where: {
                id: previousOpportunityId,
                workspaceId: context.workspaceId,
              },
              select: { id: true, number: true },
            });
          if (existing) {
            return {
              opportunityId: existing.id,
              number: existing.number,
              alreadyExists: true,
            };
          }
        }

        const opportunity =
          await transaction.opportunity.create({
            data: {
              workspaceId: context.workspaceId,
              projectId: request.projectId,
              number: `RFQ-${request.number}`.slice(0, 100),
              title: request.title,
              description: request.description,
              type: "RFQ",
              status: "DRAFT",
              visibility: "INVITED",
              category: request.category,
              priority: request.priority,
              budget: request.estimatedTotal,
              currency: request.currency,
              issueDate: new Date(),
              createdById: context.actorUserId,
              items: {
                create: request.items.map((item) => ({
                  lineNumber: item.lineNumber,
                  description: item.description,
                  quantity: item.quantity,
                  unit: item.unit,
                  specification: item.specification,
                  notes: item.notes,
                })),
              },
            },
            select: { id: true, number: true },
          });

        await transaction.auditLog.createMany({
          data: [
            {
              workspaceId: context.workspaceId,
              userId: context.actorUserId,
              action: "opportunity.created",
              entityType: "Opportunity",
              entityId: opportunity.id,
              metadata: {
                number: opportunity.number,
                type: "RFQ",
                sourceProcurementRequestId: request.id,
              },
            },
            {
              workspaceId: context.workspaceId,
              userId: context.actorUserId,
              action: "procurement.rfq_created",
              entityType: "ProcurementRequest",
              entityId: request.id,
              metadata: {
                number: request.number,
                opportunityId: opportunity.id,
                opportunityNumber: opportunity.number,
                itemCount: request.items.length,
              },
            },
          ],
        });

        return {
          opportunityId: opportunity.id,
          number: opportunity.number,
          alreadyExists: false,
        };
      },
    );

    revalidatePath("/platform/opportunities");
    revalidatePath(
      `/platform/opportunities/${result.opportunityId}`,
    );
    revalidatePath(
      `/platform/procurement/${normalizedId}`,
    );

    return procurementActionSuccess(
      result,
      result.alreadyExists
        ? "طلب عرض السعر موجود مسبقاً."
        : "تم إنشاء مسودة طلب عرض السعر ونقل البنود بنجاح.",
    );
  } catch (error) {
    return procurementActionFailure(
      error instanceof Error && error.message.trim()
        ? error.message
        : "تعذر إنشاء طلب عرض السعر.",
    );
  }
}
