import type {
  CurrentWorkspaceContext,
} from "@/lib/workspace-context";

import {
  PermissionDeniedError,
} from "./permission.errors";
import {
  hasPermission,
} from "./has-permission";
import type {
  PermissionCode,
} from "./permission.types";

export function requirePermission(
  context: CurrentWorkspaceContext,
  permission: PermissionCode,
): PermissionCode {
  if (!hasPermission(context, permission)) {
    throw new PermissionDeniedError(
      permission,
    );
  }

  return permission;
}
