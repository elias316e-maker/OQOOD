import type {
  CurrentWorkspaceContext,
} from "@/lib/workspace-context";

import type {
  PermissionCode,
} from "./permission.types";

export function resolvePermissionCodes(
  context: CurrentWorkspaceContext,
): ReadonlySet<PermissionCode> {
  const permissions = new Set<PermissionCode>();

  for (const membershipRole of context.roles) {
    for (const rolePermission of membershipRole.role.permissions) {
      permissions.add(
        rolePermission.permission.code as PermissionCode,
      );
    }
  }

  return permissions;
}
