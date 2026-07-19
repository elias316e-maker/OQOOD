import "dotenv/config";

import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import { prisma } from "@/lib/prisma";
import {
  DefaultWorkspaceBootstrapService,
  WorkspaceAlreadyExistsError,
} from "@/features/workspace/services";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function createUniqueId(): string {
  return [
    Date.now(),
    Math.random().toString(36).slice(2, 10),
  ].join("-");
}

describe.sequential(
  "Workspace Bootstrap Integration",
  () => {
    const createdUserIds = new Set<string>();
    const createdWorkspaceIds = new Set<string>();

    beforeAll(async () => {
      const plan = await prisma.plan.findUnique({
        where: {
          code_version: {
            code: "PROFESSIONAL",
            version: 1,
          },
        },
        select: {
          status: true,
          trialDays: true,
          isDefaultTrial: true,
        },
      });

      if (
        !plan ||
        plan.status !== "ACTIVE" ||
        plan.trialDays !== 30 ||
        !plan.isDefaultTrial
      ) {
        throw new Error(
          "PROFESSIONAL v1 trial plan is unavailable. Run Prisma seed first.",
        );
      }

      const activeUsageMeters =
        await prisma.usageMeter.count({
          where: {
            isActive: true,
          },
        });

      if (activeUsageMeters !== 5) {
        throw new Error(
          `Expected 5 active usage meters, found ${activeUsageMeters}.`,
        );
      }
    });

    afterAll(async () => {
      for (const workspaceId of createdWorkspaceIds) {
        /*
         * AuditLog intentionally uses onDelete: Restrict.
         * Test-owned audit records must be removed explicitly
         * before deleting the Workspace.
         */
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

      if (createdUserIds.size > 0) {
        await prisma.user.deleteMany({
          where: {
            id: {
              in: [...createdUserIds],
            },
          },
        });
      }

      await prisma.$disconnect();
    });

    it(
      "creates the complete workspace and trial state",
      async () => {
        const uniqueId = createUniqueId();

        const user = await prisma.user.create({
          data: {
            name: "Workspace Integration Test",
            email:
              `workspace-integration-${uniqueId}` +
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

        const result = await service.execute(user.id, {
          workspaceNameAr:
            "مساحة اختبار التكامل",
          workspaceNameEn:
            `Integration Workspace ${uniqueId}`,
          companyNameAr:
            "شركة اختبار التكامل",
          companyNameEn:
            "Integration Test Company",
          commercialRegister:
            `TEST-${uniqueId}`,
          countryCode: "SA",
          timezone: "Asia/Riyadh",
          defaultLanguage: "ar",
          defaultCurrency: "SAR",
        });

        createdWorkspaceIds.add(
          result.workspace.id,
        );

        const workspace =
          await prisma.workspace.findUnique({
            where: {
              id: result.workspace.id,
            },
            include: {
              companies: true,
              members: {
                include: {
                  roles: {
                    include: {
                      role: true,
                    },
                  },
                },
              },
              billingAccount: true,
              subscription: {
                include: {
                  plan: true,
                  usageCounters: {
                    include: {
                      meter: true,
                    },
                  },
                },
              },
              auditLogs: {
                where: {
                  action:
                    "workspace.bootstrap.completed",
                },
              },
            },
          });

        expect(workspace).not.toBeNull();

        if (!workspace) {
          throw new Error(
            "Workspace was not persisted.",
          );
        }

        expect(workspace.status).toBe("ACTIVE");
        expect(workspace.companies).toHaveLength(1);
        expect(workspace.members).toHaveLength(1);

        const membership = workspace.members[0];

        expect(membership?.status).toBe("ACTIVE");

        const ownerRole =
          membership?.roles.find(
            (assignment) =>
              assignment.role.code === "OWNER",
          );

        expect(ownerRole).toBeDefined();

        expect(
          workspace.billingAccount,
        ).not.toBeNull();

        expect(
          workspace.subscription,
        ).not.toBeNull();

        const subscription =
          workspace.subscription;

        if (!subscription) {
          throw new Error(
            "Subscription was not persisted.",
          );
        }

        expect(subscription.plan.code).toBe(
          "PROFESSIONAL",
        );

        expect(subscription.plan.version).toBe(1);
        expect(subscription.status).toBe(
          "TRIALING",
        );
        expect(subscription.accessState).toBe(
          "FULL",
        );

        expect(
          subscription.trialStartsAt,
        ).not.toBeNull();

        expect(
          subscription.trialEndsAt,
        ).not.toBeNull();

        if (
          !subscription.trialStartsAt ||
          !subscription.trialEndsAt
        ) {
          throw new Error(
            "Trial dates were not persisted.",
          );
        }

        const trialDuration =
          subscription.trialEndsAt.getTime() -
          subscription.trialStartsAt.getTime();

        expect(trialDuration).toBe(
          30 * DAY_IN_MS,
        );

        expect(
          subscription.currentPeriodStartsAt,
        ).toEqual(subscription.trialStartsAt);

        expect(
          subscription.currentPeriodEndsAt,
        ).toEqual(subscription.trialEndsAt);

        expect(
          subscription.usageCounters,
        ).toHaveLength(5);

        const memberCounter =
          subscription.usageCounters.find(
            (counter) =>
              counter.meter.code ===
              "ACTIVE_WORKSPACE_MEMBERS",
          );

        expect(memberCounter).toBeDefined();

        expect(
          memberCounter?.value.toString(),
        ).toBe("1");

        expect(workspace.auditLogs).toHaveLength(1);

        expect(result.billing.planCode).toBe(
          "PROFESSIONAL",
        );

        expect(result.billing.planVersion).toBe(1);

        expect(
          result.billing.subscriptionStatus,
        ).toBe("TRIALING");

        expect(
          result.billing.workspaceAccessState,
        ).toBe("FULL");
      },
    );

    it(
      "prevents first-run bootstrap from running twice",
      async () => {
        const uniqueId = createUniqueId();

        const user = await prisma.user.create({
          data: {
            name: "Duplicate Bootstrap Test",
            email:
              `workspace-duplicate-${uniqueId}` +
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

        const result = await service.execute(user.id, {
          workspaceNameAr:
            "مساحة الاختبار الأولى",
          workspaceNameEn:
            `First Workspace ${uniqueId}`,
          companyNameAr:
            "شركة الاختبار الأولى",
          commercialRegister:
            `DUP-${uniqueId}`,
          countryCode: "SA",
          timezone: "Asia/Riyadh",
          defaultLanguage: "ar",
          defaultCurrency: "SAR",
        });

        createdWorkspaceIds.add(
          result.workspace.id,
        );

        await expect(
          service.execute(user.id, {
            workspaceNameAr:
              "مساحة اختبار مكررة",
            companyNameAr:
              "شركة اختبار مكررة",
            countryCode: "SA",
            timezone: "Asia/Riyadh",
            defaultLanguage: "ar",
            defaultCurrency: "SAR",
          }),
        ).rejects.toBeInstanceOf(
          WorkspaceAlreadyExistsError,
        );

        const memberships =
          await prisma.workspaceMember.count({
            where: {
              userId: user.id,
              status: "ACTIVE",
            },
          });

        expect(memberships).toBe(1);

        const subscriptions =
          await prisma.subscription.count({
            where: {
              workspaceId: result.workspace.id,
            },
          });

        expect(subscriptions).toBe(1);
      },
    );
  },
);
