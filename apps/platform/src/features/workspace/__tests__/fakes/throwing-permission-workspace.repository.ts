import type {
  WorkspaceTransactionClient,
} from "@/features/workspace/repositories";

import {
  PrismaWorkspaceRepository,
} from "@/features/workspace/repositories";

export class ThrowingPermissionWorkspaceRepository
  extends PrismaWorkspaceRepository
{
  override async assignAllPermissionsToRole(
    _transaction: WorkspaceTransactionClient,
    _roleId: string,
  ): Promise<void> {
    throw new Error(
      "Injected OWNER Permission Assignment Failure",
    );
  }
}
