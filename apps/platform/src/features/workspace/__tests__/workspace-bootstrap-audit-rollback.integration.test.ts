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
  ThrowingAuditWorkspaceRepository,
} from "./fakes/throwing-audit-workspace.repository";

function createUniqueId(): string {
  return [
    Date.now(),
    Math.random().toString(36).slice(2, 10),
  ].join("-");
}

describe.sequential(
  "Workspace Bootstrap AuditLog Rollback",
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
      "rolls back workspace core and billing when AuditLog creation fails",
      async () => {
        const uniqueId = createUniqueId();

        const user = await prisma.user.create({
          data: {
            name: "Audit Rollback Test",
            email:
              `workspace-audit-rollback-${uniqueId}` +
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
          new ThrowingAuditWorkspaceRepository();

        const service =
          new DefaultWorkspaceBootstrapService(
            repository,
          );

        await expect(
          service.execute(user.id, {
            workspaceNameAr:
              "مساحة اختبار تراجع سجل التدقيق",
            workspaceNameEn:
              `Audit Rollback Workspace ${uniqueId}`,
            companyNameAr:
              "شركة اختبار تراجع سجل التدقيق",
            companyNameEn:
              "Audit Rollback Test Company",
            commercialRegister:
              `AUDIT-ROLLBACK-${uniqueId}`,
            countryCode: "SA",
            timezone: "Asia/Riyadh",
            defaultLanguage: "ar",
            defaultCurrency: "SAR",
          }),
        ).rejects.toThrow(
          "Injected AuditLog Failure",
        );

        const [
          workspaceCount,
          companyCount,
          membershipCount,
          roleCount,
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

        expect({
          workspaceCount,
          companyCount,
          membershipCount,
          roleCount,
          roleAssignmentCount,
          billingAccountCount,
          subscriptionCount,
          usageCounterCount,
          auditLogCount,
        }).toEqual({
          workspaceCount: 0,
          companyCount: 0,
          membershipCount: 0,
          roleCount: 0,
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
