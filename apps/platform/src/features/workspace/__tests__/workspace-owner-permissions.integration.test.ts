import "dotenv/config";

import {
  afterAll,
  describe,
  expect,
  it,
} from "vitest";

import { prisma } from "@/lib/prisma";
import {
  Permissions,
  type PermissionCode,
} from "@/lib/permissions";
import {
  DefaultWorkspaceBootstrapService,
} from "@/features/workspace/services";

function createUniqueId(): string {
  return [
    Date.now(),
    Math.random().toString(36).slice(2, 10),
  ].join("-");
}

function collectPermissionCodes(
  value: unknown,
): PermissionCode[] {
  if (typeof value === "string") {
    return [value as PermissionCode];
  }

  if (
    typeof value !== "object" ||
    value === null
  ) {
    return [];
  }

  return Object.values(value).flatMap(
    collectPermissionCodes,
  );
}

describe.sequential(
  "Workspace OWNER Permission Assignment",
  () => {
    const createdUserIds = new Set<string>();
    const createdWorkspaceIds = new Set<string>();

    afterAll(async () => {
      for (
        const workspaceId
        of createdWorkspaceIds
      ) {
        await prisma.auditLog.deleteMany({
          where: {
            workspaceId,
          },
        });

        await prisma.workspace.deleteMany({
          where: {
            id: workspaceId,
          },
        });
      }

      for (const userId of createdUserIds) {
        await prisma.user.deleteMany({
          where: {
            id: userId,
          },
        });
      }

      await prisma.$disconnect();
    });

    it(
      "assigns every registered permission to the new OWNER role",
      async () => {
        const uniqueId = createUniqueId();

        const user = await prisma.user.create({
          data: {
            name: "OWNER Permissions Test",
            email:
              `owner-permissions-${uniqueId}` +
              "@example.test",
            emailVerified: true,
            isActive: true,
          },
          select: {
            id: true,
          },
        });

        createdUserIds.add(user.id);

        const service =
          new DefaultWorkspaceBootstrapService();

        const result = await service.execute(
          user.id,
          {
            workspaceNameAr:
              "مساحة اختبار صلاحيات المالك",
            workspaceNameEn:
              `OWNER Permissions ${uniqueId}`,
            companyNameAr:
              "شركة اختبار صلاحيات المالك",
            companyNameEn:
              "OWNER Permissions Company",
            commercialRegister:
              `OWNER-PERM-${uniqueId}`,
            countryCode: "SA",
            timezone: "Asia/Riyadh",
            defaultLanguage: "ar",
            defaultCurrency: "SAR",
          },
        );

        createdWorkspaceIds.add(
          result.workspace.id,
        );

        const membership =
          await prisma.workspaceMember.findUnique({
            where: {
              workspaceId_userId: {
                workspaceId:
                  result.workspace.id,
                userId: user.id,
              },
            },

            include: {
              roles: {
                include: {
                  role: {
                    include: {
                      permissions: {
                        include: {
                          permission: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          });

        expect(membership).not.toBeNull();

        const ownerAssignments =
          membership?.roles.filter(
            (assignment) =>
              assignment.role.code === "OWNER",
          ) ?? [];

        expect(ownerAssignments).toHaveLength(1);

        const ownerRole =
          ownerAssignments[0]?.role;

        expect(ownerRole).toBeDefined();

        const expectedCodes = [
          ...new Set(
            collectPermissionCodes(
              Permissions,
            ),
          ),
        ].sort();

        const actualCodes = [
          ...new Set(
            ownerRole?.permissions.map(
              (assignment) =>
                assignment.permission.code,
            ) ?? [],
          ),
        ].sort();

        expect(expectedCodes.length).toBeGreaterThan(
          0,
        );

        expect(actualCodes).toEqual(
          expectedCodes,
        );

        expect(
          ownerRole?.permissions,
        ).toHaveLength(
          expectedCodes.length,
        );

        const databasePermissionCount =
          await prisma.permission.count({
            where: {
              code: {
                in: expectedCodes,
              },
            },
          });

        expect(databasePermissionCount).toBe(
          expectedCodes.length,
        );
      },
    );
  },
);
