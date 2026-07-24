import { prisma } from "@/lib/prisma";

import type {
  PermissionCode,
} from "@/lib/permissions";

export type PermissionTestContext = {
  grantPermission(
    permission: PermissionCode,
  ): Promise<void>;

  revokePermission(
    permission: PermissionCode,
  ): Promise<void>;
};

export function createPermissionTestContext(
  roleId: string,
): PermissionTestContext {
  async function findPermissionId(
    permission: PermissionCode,
  ): Promise<string> {
    const record =
      await prisma.permission.findUnique({
        where: {
          code: permission,
        },
        select: {
          id: true,
        },
      });

    if (!record) {
      throw new Error(
        `Permission not found: ${permission}`,
      );
    }

    return record.id;
  }

  async function grantPermission(
    permission: PermissionCode,
  ): Promise<void> {
    const permissionId =
      await findPermissionId(permission);

    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
      update: {},
      create: {
        roleId,
        permissionId,
      },
    });
  }

  async function revokePermission(
    permission: PermissionCode,
  ): Promise<void> {
    const permissionId =
      await findPermissionId(permission);

    await prisma.rolePermission.deleteMany({
      where: {
        roleId,
        permissionId,
      },
    });
  }

  return {
    grantPermission,
    revokePermission,
  };
}
