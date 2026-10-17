import "dotenv/config";

import {
  afterAll,
  describe,
  expect,
  it,
} from "vitest";

import { prisma } from "@/lib/prisma";
import {
  PrismaWorkspaceRepository,
} from "@/features/workspace/repositories";
import {
  DefaultWorkspaceBootstrapService,
} from "@/features/workspace/services";

import {
  ThrowingBillingInitializer,
} from "./fakes/throwing-billing-initializer";

function createUniqueId(): string {
  return [
    Date.now(),
    Math.random().toString(36).slice(2, 10),
  ].join("-");
}

describe.sequential(
  "Workspace Bootstrap Transaction Rollback",
  () => {
    const createdUserIds = new Set<string>();

    afterAll(async () => {
      for (const userId of createdUserIds) {
        /*
         * هذا التنظيف احترازي فقط في حال فشل الاختبار
         * قبل إثبات الـRollback.
         */
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
      "rolls back the entire workspace bootstrap when billing initialization fails",
      async () => {
        const uniqueId = createUniqueId();

        const user = await prisma.user.create({
          data: {
            name: "Workspace Rollback Test",
            email:
              `workspace-rollback-${uniqueId}` +
              "@example.test",
            emailVerified: true,
            isActive: true,
          },
          select: {
            id: true,
          },
        });

        createdUserIds.add(user.id);

        const repository =
          new PrismaWorkspaceRepository();

        const billingInitializer =
          new ThrowingBillingInitializer();

        const service =
          new DefaultWorkspaceBootstrapService(
            repository,
            billingInitializer,
          );

        await expect(
          service.execute(user.id, {
            workspaceNameAr:
              "مساحة اختبار التراجع الكامل",
            workspaceNameEn:
              `Rollback Workspace ${uniqueId}`,
            companyNameAr:
              "شركة اختبار التراجع الكامل",
            companyNameEn:
              "Rollback Test Company",
            commercialRegister:
              `ROLLBACK-${uniqueId}`,
            countryCode: "SA",
            timezone: "Asia/Riyadh",
            defaultLanguage: "ar",
            defaultCurrency: "SAR",
          }),
        ).rejects.toThrow(
          "Injected Billing Failure",
        );

        const [
          workspaceCount,
          companyCount,
          membershipCount,
          ownerRoleCount,
          roleAssignmentCount,
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
              code: "OWNER",
            },
          }),

          prisma.workspaceMemberRole.count({
            where: {
              workspaceMember: {
                userId: user.id,
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

        const persistedState = {
          workspaceCount,
          companyCount,
          membershipCount,
          ownerRoleCount,
          roleAssignmentCount,
          billingAccountCount,
          subscriptionCount,
          usageCounterCount,
          auditLogCount,
        };

        expect(persistedState).toEqual({
          workspaceCount: 0,
          companyCount: 0,
          membershipCount: 0,
          ownerRoleCount: 0,
          roleAssignmentCount: 0,
          billingAccountCount: 0,
          subscriptionCount: 0,
          usageCounterCount: 0,
          auditLogCount: 0,
        });
      },
    );
  },
);
