"use server";

import { prisma } from "@/lib/prisma";

import {
  procurementActionFailure,
  procurementActionSuccess,
  type ProcurementActionResult,
} from "./action-result";
import {
  resolveProcurementActionContext,
} from "./helpers";

export type ProcurementAuditEntry = {
  id: string;
  action: string;
  actorName: string;
  reason: string | null;
  createdAt: string;
};

export async function listProcurementAuditAction(
  procurementRequestId: string,
): Promise<
  ProcurementActionResult<ProcurementAuditEntry[]>
> {
  try {
    const normalizedId = procurementRequestId.trim();
    const { workspaceId } =
      await resolveProcurementActionContext();

    if (!normalizedId) {
      return procurementActionFailure(
        "معرف طلب المشتريات غير صالح.",
      );
    }

    const entries = await prisma.auditLog.findMany({
      where: {
        workspaceId,
        entityType: "ProcurementRequest",
        entityId: normalizedId,
      },
      select: {
        id: true,
        action: true,
        metadata: true,
        createdAt: true,
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    return procurementActionSuccess(
      entries.map((entry) => {
        const metadata =
          entry.metadata &&
          typeof entry.metadata === "object" &&
          !Array.isArray(entry.metadata)
            ? entry.metadata
            : null;
        const reason =
          metadata &&
          "reason" in metadata &&
          typeof metadata.reason === "string"
            ? metadata.reason
            : null;

        return {
          id: entry.id,
          action: entry.action,
          actorName: entry.user?.name ?? "مستخدم سابق",
          reason,
          createdAt: entry.createdAt.toISOString(),
        };
      }),
    );
  } catch {
    return procurementActionFailure(
      "تعذر تحميل سجل إجراءات طلب المشتريات.",
    );
  }
}
