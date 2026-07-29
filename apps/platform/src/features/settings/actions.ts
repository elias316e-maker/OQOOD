"use server";

import { revalidatePath } from "next/cache";

import { requireAuthenticatedUser } from "@/features/workspace/guards";
import { hasPermission, Permissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

import { createInvitationToken } from "./invitation-token";
import { queueNotificationEmail } from "@/features/notifications/email-delivery";

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
        prisma.role.findFirst({
          where: { id: roleId, workspaceId },
          select: { id: true, name: true, code: true },
        }),
      ]);
      if (!role) throw new Error("الدور المحدد غير موجود.");
      if (role.code === "OWNER") {
        throw new Error("لا يمكن منح دور المالك من إدارة الأعضاء. استخدم إجراء نقل الملكية المخصص.");
      }
      if (!user) {
        const { token, tokenHash } = createInvitationToken();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const invitation = await prisma.$transaction(async (transaction) => {
          await transaction.workspaceInvitation.updateMany({
            where: { workspaceId, email, status: "PENDING" },
            data: { status: "REVOKED", revokedAt: new Date() },
          });
          const created = await transaction.workspaceInvitation.create({
            data: {
              workspaceId,
              email,
              roleId: role.id,
              tokenHash,
              invitedById: actor.id,
              expiresAt,
            },
          });
          await transaction.auditLog.create({
            data: {
              workspaceId,
              userId: actor.id,
              action: "workspace.invitation_created",
              entityType: "WorkspaceInvitation",
              entityId: created.id,
              metadata: { email, roleId: role.id, expiresAt },
            },
          });
          return created;
        });
        const publicUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? process.env.BETTER_AUTH_URL ?? "";
        const invitationUrl = `${publicUrl.replace(/\/$/, "")}/invitations/${token}`;
        await queueNotificationEmail({
          workspaceId,
          category: "TEAM_INVITATIONS",
          recipient: invitation.email,
          subject: `دعوة للانضمام إلى ${context.workspace.nameAr} على OQOOD`,
          body: `دعاك فريق ${context.workspace.nameAr} للانضمام بدور ${role.name}. تنتهي الدعوة خلال 7 أيام.`,
          href: invitationUrl,
        });
        refreshSettings();
        return {
          status: "success",
          message: `تم إنشاء دعوة صالحة لمدة 7 أيام: /invitations/${token} (${invitation.email})`,
        };
      }
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
      if (role.code === "OWNER" && !isOwner) {
        throw new Error("لا يمكن منح دور المالك من إدارة الأعضاء. استخدم إجراء نقل الملكية المخصص.");
      }
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

    if (intent === "revoke-invitation") {
      if (!hasPermission(context, Permissions.workspace.manageMembers)) {
        throw new Error("لا تملك صلاحية إدارة أعضاء الفريق.");
      }
      const invitationId = value(formData, "invitationId");
      const invitation = await prisma.workspaceInvitation.findFirst({
        where: { id: invitationId, workspaceId, status: "PENDING" },
      });
      if (!invitation) throw new Error("الدعوة غير موجودة أو لم تعد معلقة.");
      await prisma.$transaction([
        prisma.workspaceInvitation.update({
          where: { id: invitation.id },
          data: { status: "REVOKED", revokedAt: new Date() },
        }),
        prisma.auditLog.create({
          data: {
            workspaceId,
            userId: actor.id,
            action: "workspace.invitation_revoked",
            entityType: "WorkspaceInvitation",
            entityId: invitation.id,
            metadata: { email: invitation.email },
          },
        }),
      ]);
      refreshSettings();
      return { status: "success", message: "تم إلغاء الدعوة." };
    }

    if (intent === "transfer-ownership") {
      const targetMemberId = value(formData, "targetMemberId");
      const fallbackRoleId = value(formData, "fallbackRoleId");
      const actorMember = await prisma.workspaceMember.findFirst({
        where: { workspaceId, userId: actor.id, status: "ACTIVE" },
        include: { roles: { include: { role: true } } },
      });
      const actorIsOwner = actorMember?.roles.some(
        (assignment) => assignment.role.code === "OWNER",
      );
      if (!actorMember || !actorIsOwner) {
        throw new Error("نقل الملكية متاح للمالك الحالي فقط.");
      }
      const [target, ownerRole, fallbackRole] = await Promise.all([
        prisma.workspaceMember.findFirst({
          where: { id: targetMemberId, workspaceId, status: "ACTIVE" },
          include: { roles: { include: { role: true } } },
        }),
        prisma.role.findFirst({ where: { workspaceId, code: "OWNER" } }),
        prisma.role.findFirst({
          where: {
            id: fallbackRoleId,
            workspaceId,
            code: { not: "OWNER" },
          },
        }),
      ]);
      if (!target || !ownerRole || !fallbackRole) {
        throw new Error("تعذر العثور على العضو المستلم أو الدور البديل.");
      }
      if (target.userId === actor.id) {
        throw new Error("اختر عضوًا آخر لنقل الملكية إليه.");
      }
      await prisma.$transaction(async (transaction) => {
        await transaction.workspaceMemberRole.deleteMany({
          where: {
            workspaceMemberId: { in: [actorMember.id, target.id] },
          },
        });
        await transaction.workspaceMemberRole.createMany({
          data: [
            { workspaceMemberId: actorMember.id, roleId: fallbackRole.id },
            { workspaceMemberId: target.id, roleId: ownerRole.id },
          ],
        });
        await transaction.auditLog.create({
          data: {
            workspaceId,
            userId: actor.id,
            action: "workspace.ownership_transferred",
            entityType: "Workspace",
            entityId: workspaceId,
            metadata: {
              previousOwnerUserId: actor.id,
              newOwnerUserId: target.userId,
              fallbackRoleId: fallbackRole.id,
            },
          },
        });
      });
      refreshSettings();
      return { status: "success", message: "تم نقل ملكية مساحة العمل بأمان." };
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

    if (intent === "update-role") {
      if (!hasPermission(context, Permissions.workspace.manageRoles)) {
        throw new Error("لا تملك صلاحية إدارة الأدوار.");
      }
      const roleId = value(formData, "roleId");
      const name = value(formData, "name");
      const description = value(formData, "description") || null;
      const permissionCodes = formData.getAll("permissions").filter(
        (item): item is string => typeof item === "string",
      );
      if (name.length < 2 || name.length > 80) {
        throw new Error("اسم الدور يجب أن يكون بين حرفين و80 حرفًا.");
      }
      if (!permissionCodes.length) {
        throw new Error("حدد صلاحية واحدة على الأقل.");
      }
      const [role, permissions] = await Promise.all([
        prisma.role.findFirst({ where: { id: roleId, workspaceId } }),
        prisma.permission.findMany({
          where: { code: { in: permissionCodes } },
          select: { id: true, code: true },
        }),
      ]);
      if (!role) throw new Error("الدور غير موجود.");
      if (role.isSystem || role.code === "OWNER") {
        throw new Error("لا يمكن تعديل الدور النظامي.");
      }
      if (permissions.length !== new Set(permissionCodes).size) {
        throw new Error("توجد صلاحية غير صالحة.");
      }
      await prisma.$transaction(async (transaction) => {
        await transaction.role.update({
          where: { id: role.id },
          data: { name, description },
        });
        await transaction.rolePermission.deleteMany({
          where: { roleId: role.id },
        });
        await transaction.rolePermission.createMany({
          data: permissions.map((permission) => ({
            roleId: role.id,
            permissionId: permission.id,
          })),
        });
        await transaction.auditLog.create({
          data: {
            workspaceId,
            userId: actor.id,
            action: "workspace.role_updated",
            entityType: "Role",
            entityId: role.id,
            metadata: { name, permissionCodes },
          },
        });
      });
      refreshSettings();
      return { status: "success", message: `تم تحديث دور «${name}».` };
    }

    if (intent === "delete-role") {
      if (!hasPermission(context, Permissions.workspace.manageRoles)) {
        throw new Error("لا تملك صلاحية إدارة الأدوار.");
      }
      const roleId = value(formData, "roleId");
      const role = await prisma.role.findFirst({
        where: { id: roleId, workspaceId },
        include: { _count: { select: { members: true } } },
      });
      if (!role) throw new Error("الدور غير موجود.");
      if (role.isSystem || role.code === "OWNER") {
        throw new Error("لا يمكن حذف الدور النظامي.");
      }
      if (role._count.members > 0) {
        throw new Error("لا يمكن حذف دور مرتبط بأعضاء. انقل الأعضاء إلى دور آخر أولًا.");
      }
      await prisma.$transaction([
        prisma.role.delete({ where: { id: role.id } }),
        prisma.auditLog.create({
          data: {
            workspaceId,
            userId: actor.id,
            action: "workspace.role_deleted",
            entityType: "Role",
            entityId: role.id,
            metadata: { name: role.name, code: role.code },
          },
        }),
      ]);
      refreshSettings();
      return { status: "success", message: `تم حذف دور «${role.name}».` };
    }

    throw new Error("العملية المطلوبة غير معروفة.");
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "تعذر تنفيذ العملية.",
    };
  }
}
