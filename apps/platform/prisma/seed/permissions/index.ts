import type {
  PrismaClient,
} from "../../../src/generated/prisma/client";

import {
  assignPermissionsToExistingOwnerRoles,
} from "./owner";
import {
  seedPermissions,
} from "./catalog";

export async function seedPermissionCatalog(
  prisma: PrismaClient,
) {
  console.log(
    "Seeding OQOOD permission catalog...",
  );

  const permissions =
    await seedPermissions(prisma);

  const assignment =
    await assignPermissionsToExistingOwnerRoles(
      prisma,
      [...permissions.values()].map(
        (permission) => permission.id,
      ),
    );

  console.log(
    "OQOOD permission catalog seeded successfully.",
    assignment,
  );

  return {
    permissions,
    ...assignment,
  };
}
