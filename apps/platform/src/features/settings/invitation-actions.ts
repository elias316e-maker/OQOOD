"use server";

import { redirect } from "next/navigation";

import { requireAuthenticatedUser } from "@/features/workspace/guards";
import { prisma } from "@/lib/prisma";

import { hashInvitationToken } from "./invitation-token";

export async function acceptWorkspaceInvitationAction(formData: FormData) {
  const user = await requireAuthenticatedUser();
  const token = String(formData.get("token") ?? "").trim();
  const tokenHash = hashInvitationToken(token);
  const invitation = await prisma.workspaceInvitation.findUnique({
    where: { tokenHash },
    include: { role: { select: { id: true, code: true } } },
  });
  if (!invitation || invitation.status !== "PENDING") {
    throw new Error("الدعوة غير موجودة أو لم تعد صالحة.");
  }
  if (invitation.expiresAt <= new Date()) {
    await prisma.workspaceInvitation.update({
      where: { id: invitation.id },
      data: { status: "EXPIRED" },
    });
    throw new Error("انتهت صلاحية الدعوة.");
  }
  if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
    throw new Error("سجل الدخول بالحساب الذي أُرسلت إليه الدعوة.");
  }
  if (invitation.role.code === "OWNER") {
    throw new Error("لا يمكن قبول دعوة بدور المالك.");
  }

  await prisma.$transaction(async (transaction) => {
    const existing = await transaction.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: invitation.workspaceId,
          userId: user.id,
        },
      },
    });
    if (existing) throw new Error("أنت عضو في مساحة العمل بالفعل.");
    const member = await transaction.workspaceMember.create({
      data: {
        workspaceId: invitation.workspaceId,
        userId: user.id,
        status: "ACTIVE",
        roles: { create: { roleId: invitation.roleId } },
      },
    });
    await transaction.workspaceInvitation.update({
      where: { id: invitation.id },
      data: {
        status: "ACCEPTED",
        acceptedById: user.id,
        acceptedAt: new Date(),
      },
    });
    await transaction.auditLog.create({
      data: {
        workspaceId: invitation.workspaceId,
        userId: user.id,
        action: "workspace.invitation_accepted",
        entityType: "WorkspaceMember",
        entityId: member.id,
        metadata: { invitationId: invitation.id, roleId: invitation.roleId },
      },
    });
  });

  redirect("/platform");
}
