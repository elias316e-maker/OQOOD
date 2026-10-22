export const PlatformPermissions = {
  portalAccess: "platform.portal.access",
  staffRead: "platform.staff.read",
  staffManage: "platform.staff.manage",
  workspaceRead: "platform.workspaces.read",
  workspaceStatusManage: "platform.workspaces.status.manage",
  billingRead: "platform.billing.read",
  auditRead: "platform.audit.read",
} as const;

export type PlatformPermission =
  (typeof PlatformPermissions)[keyof typeof PlatformPermissions];

export type PlatformRole =
  | "PLATFORM_ADMIN"
  | "SUPPORT"
  | "BILLING"
  | "AUDITOR";

const rolePermissions: Readonly<
  Record<PlatformRole, readonly PlatformPermission[]>
> = {
  PLATFORM_ADMIN: Object.values(PlatformPermissions),
  SUPPORT: [
    PlatformPermissions.portalAccess,
    PlatformPermissions.workspaceRead,
  ],
  BILLING: [
    PlatformPermissions.portalAccess,
    PlatformPermissions.billingRead,
  ],
  AUDITOR: [
    PlatformPermissions.portalAccess,
    PlatformPermissions.workspaceRead,
    PlatformPermissions.billingRead,
    PlatformPermissions.auditRead,
  ],
};

// A role mapping only. This does not establish staff membership,
// active status, session assurance, or authorization by itself.
export function platformRoleHasPermission(
  role: string,
  permission: string,
): boolean {
  if (!Object.prototype.hasOwnProperty.call(rolePermissions, role)) {
    return false;
  }

  return rolePermissions[role as PlatformRole].some(
    (allowed) => allowed === permission,
  );
}
