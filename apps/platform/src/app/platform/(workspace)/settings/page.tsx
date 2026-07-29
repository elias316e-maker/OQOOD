import { hasPermission, Permissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/session";
import { requireCurrentWorkspace } from "@/lib/workspace-context";
import { SettingsControlPanel } from "@/features/settings/settings-control-panel";
import { AccountSecurityPanel } from "@/features/settings/account-security-panel";

import styles from "./settings.module.css";

export default async function SettingsPage() {
  const context = await requireCurrentWorkspace();
  const currentUser = await requireCurrentUser();
  if (!hasPermission(context, Permissions.workspace.read)) {
    return <main className={styles.page}><p>لا تملك صلاحية عرض إعدادات مساحة العمل.</p></main>;
  }
  const [workspace, members, roles, permissions, invitations] = await Promise.all([
    prisma.workspace.findUniqueOrThrow({
      where: { id: context.workspace.id },
      select: { nameAr: true, nameEn: true, timezone: true, defaultCurrency: true, defaultLanguage: true },
    }),
    prisma.workspaceMember.findMany({
      where: { workspaceId: context.workspace.id },
      include: { user: { select: { id: true, name: true, email: true } }, roles: { include: { role: { select: { id: true, code: true } } } } },
      orderBy: [{ status: "asc" }, { joinedAt: "asc" }],
    }),
    prisma.role.findMany({
      where: { workspaceId: context.workspace.id },
      include: { permissions: { include: { permission: { select: { code: true } } } } },
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    }),
    prisma.permission.findMany({ orderBy: { code: "asc" } }),
    prisma.workspaceInvitation.findMany({
      where: { workspaceId: context.workspace.id, status: "PENDING" },
      include: { role: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div><span>إدارة المنصة</span><h1>الإعدادات والفريق</h1><p>إدارة هوية مساحة العمل وأعضائها وأدوار الوصول من مكان واحد.</p></div>
        <div><b>{members.filter((member) => member.status === "ACTIVE").length}</b><small>عضو نشط</small></div>
      </header>
      <SettingsControlPanel
        canManageMembers={hasPermission(context, Permissions.workspace.manageMembers)}
        canManageRoles={hasPermission(context, Permissions.workspace.manageRoles)}
        canUpdateWorkspace={hasPermission(context, Permissions.workspace.update)}
        currentMemberId={context.id}
        currentUserIsOwner={context.roles.some((assignment) => assignment.role.code === "OWNER")}
        invitations={invitations.map((invitation) => ({
          id: invitation.id,
          email: invitation.email,
          expiresAt: invitation.expiresAt.toISOString(),
          roleName: invitation.role.name,
        }))}
        members={members.map((member) => ({
          id: member.id,
          status: member.status,
          joinedAt: member.joinedAt.toISOString(),
          user: member.user,
          roleIds: member.roles.map((assignment) => assignment.role.id),
          isOwner: member.roles.some((assignment) => assignment.role.code === "OWNER"),
        }))}
        permissions={permissions}
        roles={roles.map((role) => ({
          id: role.id,
          code: role.code,
          name: role.name,
          description: role.description,
          isSystem: role.isSystem,
          permissionCodes: role.permissions.map((item) => item.permission.code),
        }))}
        workspace={workspace}
      />
      <AccountSecurityPanel
        twoFactorEnabled={Boolean(
          await prisma.user
            .findUnique({
              where: { id: currentUser.id },
              select: { twoFactorEnabled: true },
            })
            .then((user) => user?.twoFactorEnabled),
        )}
      />
    </main>
  );
}
