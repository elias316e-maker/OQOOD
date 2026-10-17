import "dotenv/config";

import {
  afterAll,
  describe,
  expect,
  it,
} from "vitest";

import { prisma } from "@/lib/prisma";
import {
  DefaultWorkspaceBootstrapService,
} from "@/features/workspace/services";

import {
  ThrowingPermissionWorkspaceRepository,
} from "./fakes/throwing-permission-workspace.repository";

function createUniqueId(): string {
  return [
    Date.now(),
    Math.random().toString(36).slice(2, 10),
  ].join("-");
}

describe.sequential(
  "Workspace OWNER Permission Rollback",
  () => {
    const createdUserIds = new Set<string>();

    afterAll(async () => {
      for (const userId of createdUserIds) {
        const workspaces =
          await prisma.workspace.findMany({
            where: {
              createdById: userId,
            },
            select: {
              id: true,
            },
          });

        const workspaceIds = workspaces.map(
          (workspace) => workspace.id,
        );

        if (workspaceIds.length > 0) {
          await prisma.auditLog.deleteMany({
            where: {
              workspaceId: {
                in: workspaceIds,
              },
            },
          });

          await prisma.workspace.deleteMany({
            where: {
              id: {
                in: workspaceIds,
              },
            },
          });
        }

        await prisma.user.deleteMany({
          where: {
            id: userId,
          },
        });
      }

      await prisma.$disconnect();
    });

    it(
      "rolls back the complete bootstrap when OWNER permission assignment fails",
      async () => {
        const uniqueId = createUniqueId();

        const user = await prisma.user.create({
          data: {
            name: "OWNER Permission Rollback Test",
            email:
              `owner-permission-rollback-${uniqueId}` +
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
          new DefaultWorkspaceBootstrapService(
            new ThrowingPermissionWorkspaceRepository(),
          );

        await expect(
          service.execute(user.id, {
            workspaceNameAr:
              "مساحة اختبار تراجع صلاحيات المالك",
            workspaceNameEn:
              `OWNER Permission Rollback ${uniqueId}`,
            companyNameAr:
              "شركة اختبار تراجع صلاحيات المالك",
            companyNameEn:
              "OWNER Permission Rollback Company",
            commercialRegister:
              `OWNER-PERM-ROLLBACK-${uniqueId}`,
            countryCode: "SA",
            timezone: "Asia/Riyadh",
            defaultLanguage: "ar",
            defaultCurrency: "SAR",
          }),
        ).rejects.toThrow(
          "Injected OWNER Permission Assignment Failure",
        );

        const [
          workspaceCount,
          companyCount,
          membershipCount,
          roleCount,
          memberRoleCount,
          rolePermissionCount,
          billingAccountCount,
          subscriptionCount,
          usageCounterCount,
          auditLogCount,
        ] = await Promise.all([
          prisma.workspace.count({
            where: {
              createdById: user.id,
            },
          }),

          prisma.company.count({
            where: {
              workspace: {
                createdById: user.id,
              },
            },
          }),

          prisma.workspaceMember.count({
            where: {
              userId: user.id,
            },
          }),

          prisma.role.count({
            where: {
              workspace: {
                createdById: user.id,
              },
            },
          }),

          prisma.workspaceMemberRole.count({
            where: {
              workspaceMember: {
                userId: user.id,
              },
            },
          }),

          prisma.rolePermission.count({
            where: {
              role: {
                workspace: {
                  createdById: user.id,
                },
              },
            },
          }),

          prisma.billingAccount.count({
            where: {
              workspace: {
                createdById: user.id,
              },
            },
          }),

          prisma.subscription.count({
            where: {
              workspace: {
                createdById: user.id,
              },
            },
          }),

          prisma.usageCounter.count({
            where: {
              workspace: {
                createdById: user.id,
              },
            },
          }),

          prisma.auditLog.count({
            where: {
              userId: user.id,
            },
          }),
        ]);

        expect({
          workspaceCount,
          companyCount,
          membershipCount,
          roleCount,
          memberRoleCount,
          rolePermissionCount,
          billingAccountCount,
          subscriptionCount,
          usageCounterCount,
          auditLogCount,
        }).toEqual({
          workspaceCount: 0,
          companyCount: 0,
          membershipCount: 0,
          roleCount: 0,
          memberRoleCount: 0,
          rolePermissionCount: 0,
          billingAccountCount: 0,
          subscriptionCount: 0,
          usageCounterCount: 0,
          auditLogCount: 0,
        });
      },
    );
  },
);
