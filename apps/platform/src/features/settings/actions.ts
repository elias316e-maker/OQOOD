"use server";

import { revalidatePath } from "next/cache";

import { requireAuthenticatedUser } from "@/features/workspace/guards";
import { hasPermission, Permissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export type SettingsActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

function value(formData: FormData, key: string) {
  const item = formData.get(key);
  return typeof item === "string" ? item.trim() : "";
}

function refreshSettings() {
  revalidatePath("/platform/settings");
  revalidatePath("/platform", "layout");
}

export async function manageSettingsAction(
  _state: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  try {
    const [context, actor] = await Promise.all([
      requireCurrentWorkspace(),
      requireAuthenticatedUser(),
    ]);
    const intent = value(formData, "intent");
    const workspaceId = context.workspace.id;

    if (intent === "update-workspace") {
      if (!hasPermission(context, Permissions.workspace.update)) {
        throw new Error("لا تملك صلاحية تعديل إعدادات مساحة العمل.");
      }
      const nameAr = value(formData, "nameAr");
      const nameEn = value(formData, "nameEn") || null;
      const timezone = value(formData, "timezone");
      const defaultCurrency = value(formData, "defaultCurrency");
      const defaultLanguage = value(formData, "defaultLanguage");
      if (nameAr.length < 2 || nameAr.length > 120) {
        throw new Error("اسم مساحة العمل يجب أن يكون بين حرفين و120 حرفًا.");
      }
      if (!["SAR", "USD", "AED", "KWD", "BHD", "QAR", "OMR"].includes(defaultCurrency)) {
        throw new Error("العملة الافتراضية غير مدعومة.");
      }
      if (!["ar", "en"].includes(defaultLanguage)) {
        throw new Error("اللغة الافتراضية غير مدعومة.");
      }
      await prisma.$transaction([
        prisma.workspace.update({
          where: { id: workspaceId },
          data: { nameAr, nameEn, timezone, defaultCurrency, defaultLanguage },
        }),
        prisma.auditLog.create({
          data: {
            workspaceId,
            userId: actor.id,
            action: "workspace.settings_updated",
            entityType: "Workspace",
            entityId: workspaceId,
            metadata: { nameAr, nameEn, timezone, defaultCurrency, defaultLanguage },
          },
        }),
      ]);
      refreshSettings();
      return { status: "success", message: "تم تحديث إعدادات مساحة العمل." };
    }

    if (intent === "add-member") {
      if (!hasPermission(context, Permissions.workspace.manageMembers)) {
        throw new Error("لا تملك صلاحية إدارة أعضاء الفريق.");
      }
      const email = value(formData, "email").toLowerCase();
      const roleId = value(formData, "roleId");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("أدخل بريدًا إلكترونيًا صالحًا.");
      }
      const [user, role] = await Promise.all([
        prisma.user.findUnique({ where: { email }, select: { id: true, name: true } }),
        prisma.role.findFirst({ where: { id: roleId, workspaceId }, select: { id: true, name: true } }),
      ]);
      if (!user) {
        throw new Error("لا يوجد حساب مسجل بهذا البريد. اطلب من المستخدم إنشاء حساب أولًا.");
      }
      if (!role) throw new Error("الدور المحدد غير موجود.");
      const existing = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: user.id } },
        select: { id: true },
      });
      if (existing) throw new Error("المستخدم عضو في مساحة العمل بالفعل.");
      await prisma.$transaction(async (transaction) => {
        const member = await transaction.workspaceMember.create({
          data: {
            workspaceId,
            userId: user.id,
            status: "ACTIVE",
            roles: { create: { roleId: role.id } },
          },
        });
        await transaction.auditLog.create({
          data: {
            workspaceId,
            userId: actor.id,
            action: "workspace.member_added",
            entityType: "WorkspaceMember",
            entityId: member.id,
            metadata: { targetUserId: user.id, email, roleId: role.id, roleName: role.name },
          },
        });
      });
      refreshSettings();
      return { status: "success", message: `تمت إضافة ${user.name} إلى الفريق.` };
    }

    if (intent === "update-member") {
      if (!hasPermission(context, Permissions.workspace.manageMembers)) {
        throw new Error("لا تملك صلاحية إدارة أعضاء الفريق.");
      }
      const memberId = value(formData, "memberId");
      const roleId = value(formData, "roleId");
      const status = value(formData, "status");
      if (!["ACTIVE", "SUSPENDED"].includes(status)) throw new Error("حالة العضوية غير صالحة.");
      const member = await prisma.workspaceMember.findFirst({
        where: { id: memberId, workspaceId },
        include: { roles: { include: { role: true } } },
      });
      const role = await prisma.role.findFirst({ where: { id: roleId, workspaceId } });
      if (!member || !role) throw new Error("تعذر العثور على العضو أو الدور.");
      const isOwner = member.roles.some((assignment) => assignment.role.code === "OWNER");
      if (isOwner && (status !== "ACTIVE" || role.code !== "OWNER")) {
        throw new Error("لا يمكن تعليق المالك أو إزالة دور المالك.");
      }
      if (member.userId === actor.id && status !== "ACTIVE") {
        throw new Error("لا يمكنك تعليق عضويتك الحالية.");
      }
      await prisma.$transaction(async (transaction) => {
        await transaction.workspaceMember.update({ where: { id: member.id }, data: { status: status as "ACTIVE" } });
        if (!isOwner) {
          await transaction.workspaceMemberRole.deleteMany({ where: { workspaceMemberId: member.id } });
          await transaction.workspaceMemberRole.create({ data: { workspaceMemberId: member.id, roleId: role.id } });
        }
        await transaction.auditLog.create({
          data: {
            workspaceId,
            userId: actor.id,
            action: "workspace.member_updated",
            entityType: "WorkspaceMember",
            entityId: member.id,
            metadata: { targetUserId: member.userId, roleId: role.id, status },
          },
        });
      });
      refreshSettings();
      return { status: "success", message: "تم تحديث العضو بنجاح." };
    }

    if (intent === "create-role") {
      if (!hasPermission(context, Permissions.workspace.manageRoles)) {
        throw new Error("لا تملك صلاحية إدارة الأدوار.");
      }
      const name = value(formData, "name");
      const description = value(formData, "description") || null;
      const permissionCodes = formData.getAll("permissions").filter((item): item is string => typeof item === "string");
      if (name.length < 2 || name.length > 80) throw new Error("اسم الدور يجب أن يكون بين حرفين و80 حرفًا.");
      if (!permissionCodes.length) throw new Error("حدد صلاحية واحدة على الأقل.");
      const permissions = await prisma.permission.findMany({
        where: { code: { in: permissionCodes } },
        select: { id: true, code: true },
      });
      if (permissions.length !== new Set(permissionCodes).size) throw new Error("توجد صلاحية غير صالحة.");
      const code = `CUSTOM_${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
      await prisma.$transaction(async (transaction) => {
        const role = await transaction.role.create({
          data: {
            workspaceId,
            code,
            name,
            description,
            permissions: { create: permissions.map((permission) => ({ permissionId: permission.id })) },
          },
        });
        await transaction.auditLog.create({
          data: {
            workspaceId,
            userId: actor.id,
            action: "workspace.role_created",
            entityType: "Role",
            entityId: role.id,
            metadata: { name, permissionCodes },
          },
        });
      });
      refreshSettings();
      return { status: "success", message: `تم إنشاء دور «${name}».` };
    }

    throw new Error("العملية المطلوبة غير معروفة.");
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "تعذر تنفيذ العملية.",
    };
  }
}
