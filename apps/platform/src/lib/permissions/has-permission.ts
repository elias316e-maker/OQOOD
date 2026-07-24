import type {
  CurrentWorkspaceContext,
} from "@/lib/workspace-context";

import type {
  PermissionCode,
} from "./permission.types";

import {
  resolvePermissionCodes,
} from "./permission-resolver";

export function hasPermission(
  context: CurrentWorkspaceContext,
  permission: PermissionCode,
): boolean {
  return resolvePermissionCodes(context).has(
    permission,
  );
}
