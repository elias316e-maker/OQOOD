import type {
  PrismaClient,
} from "../../../src/generated/prisma/client";

export async function assignPermissionsToExistingOwnerRoles(
  prisma: PrismaClient,
  permissionIds: string[],
) {
  const ownerRoles = await prisma.role.findMany({
    where: {
      code: "OWNER",
    },
    select: {
      id: true,
    },
  });

  for (const role of ownerRoles) {
    await prisma.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({
        roleId: role.id,
        permissionId,
      })),
      skipDuplicates: true,
    });
  }

  return {
    ownerRoleCount: ownerRoles.length,
    permissionCount: permissionIds.length,
  };
}
