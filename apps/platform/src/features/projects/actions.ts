"use server";

import { revalidatePath } from "next/cache";

import { requireAuthenticatedUser } from "@/features/workspace/guards";
import { hasPermission, Permissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export type ProjectFormState = {
  status: "idle" | "error" | "success";
  message?: string;
  projectId?: string;
};

function text(data: FormData, key: string) {
  const value = data.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalDate(value: string) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) throw new Error("أحد التواريخ غير صالح.");
  return date;
}

export async function createProjectAction(
  _state: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  try {
    const [context, user] = await Promise.all([
      requireCurrentWorkspace(),
      requireAuthenticatedUser(),
    ]);
    if (!hasPermission(context, Permissions.workspace.update)) {
      throw new Error("لا تملك صلاحية إنشاء المشاريع.");
    }
    const code = text(formData, "code").toUpperCase();
    const nameAr = text(formData, "nameAr");
    const nameEn = text(formData, "nameEn") || null;
    const description = text(formData, "description") || null;
    const currency = text(formData, "currency") || context.workspace.defaultCurrency;
    const budgetText = text(formData, "budget");
    const budget = budgetText ? Number(budgetText) : null;
    const startDate = optionalDate(text(formData, "startDate"));
    const endDate = optionalDate(text(formData, "endDate"));

    if (!/^[A-Z0-9-]{2,30}$/.test(code)) throw new Error("رمز المشروع يجب أن يتكون من حروف إنجليزية وأرقام وشرطات.");
    if (nameAr.length < 2 || nameAr.length > 180) throw new Error("اسم المشروع يجب أن يكون بين حرفين و180 حرفًا.");
    if (budget !== null && (!Number.isFinite(budget) || budget < 0)) throw new Error("ميزانية المشروع غير صالحة.");
    if (startDate && endDate && endDate < startDate) throw new Error("تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية.");

    const project = await prisma.$transaction(async (transaction) => {
      const created = await transaction.project.create({
        data: {
          workspaceId: context.workspace.id,
          code,
          nameAr,
          nameEn,
          description,
          status: "PLANNED",
          startDate,
          endDate,
          budget,
          currency,
          createdById: user.id,
        },
      });
      await transaction.auditLog.create({
        data: {
          workspaceId: context.workspace.id,
          userId: user.id,
          action: "project.created",
          entityType: "Project",
          entityId: created.id,
          metadata: { code, nameAr, budget, currency },
        },
      });
      return created;
    });
    revalidatePath("/platform/projects");
    return { status: "success", message: "تم إنشاء المشروع بنجاح.", projectId: project.id };
  } catch (error) {
    const duplicate =
      typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
    return {
      status: "error",
      message: duplicate ? "رمز المشروع مستخدم مسبقًا." : error instanceof Error ? error.message : "تعذر إنشاء المشروع.",
    };
  }
}

export async function updateProjectStatusAction(formData: FormData) {
  const [context, user] = await Promise.all([
    requireCurrentWorkspace(),
    requireAuthenticatedUser(),
  ]);
  if (!hasPermission(context, Permissions.workspace.update)) throw new Error("لا تملك صلاحية تحديث المشروع.");
  const projectId = text(formData, "projectId");
  const status = text(formData, "status");
  const allowed = new Set(["PLANNED", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]);
  if (!allowed.has(status)) throw new Error("حالة المشروع غير صالحة.");
  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId: context.workspace.id },
    select: { id: true, status: true },
  });
  if (!project) throw new Error("المشروع غير موجود.");
  await prisma.$transaction([
    prisma.project.update({ where: { id: project.id }, data: { status: status as "ACTIVE" } }),
    prisma.auditLog.create({
      data: {
        workspaceId: context.workspace.id,
        userId: user.id,
        action: "project.status_updated",
        entityType: "Project",
        entityId: project.id,
        metadata: { from: project.status, to: status },
      },
    }),
  ]);
  revalidatePath("/platform/projects");
  revalidatePath(`/platform/projects/${project.id}`);
}
