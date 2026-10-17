import "dotenv/config";

import {
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import {
  initializeWorkspaceTrial,
  TrialPlanNotAvailableError,
  WorkspaceBillingAlreadyInitializedError,
} from "@/features/billing";
import { prisma } from "@/lib/prisma";

function uniqueId(): string {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

const createdUserIds = new Set<string>();
const createdWorkspaceIds = new Set<string>();

async function createWorkspaceFixture() {
  const id = uniqueId();

  const user = await prisma.user.create({
    data: {
      name: "Billing Failure Test",
      email: `billing-failure-${id}@example.test`,
      emailVerified: true,
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  createdUserIds.add(user.id);

  const workspace = await prisma.workspace.create({
    data: {
      code: `BILLING-FAILURE-${id}`
        .toUpperCase()
        .slice(0, 60),
      slug: `billing-failure-${id}`
        .toLowerCase()
        .slice(0, 80),
      nameAr: "مساحة اختبار فشل الفوترة",
      nameEn: "Billing Failure Workspace",
      status: "ACTIVE",
      countryCode: "SA",
      timezone: "Asia/Riyadh",
      defaultLanguage: "ar",
      defaultCurrency: "SAR",
      createdById: user.id,
    },
    select: {
      id: true,
    },
  });

  createdWorkspaceIds.add(workspace.id);

  return {
    user,
    workspace,
    input: {
      workspaceId: workspace.id,
      ownerUserId: user.id,
      workspaceName: "مساحة اختبار فشل الفوترة",
      companyName: "شركة اختبار فشل الفوترة",
      countryCode: "SA",
      currency: "SAR",
      language: "ar",
    },
  };
}

async function cleanupWorkspace(
  workspaceId: string,
): Promise<void> {
  await prisma.auditLog.deleteMany({
    where: {
      workspaceId,
    },
  });

  await prisma.subscription.deleteMany({
    where: {
      workspaceId,
    },
  });

  await prisma.billingAccount.deleteMany({
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

describe.sequential(
  "initializeWorkspaceTrial failure cases",
  () => {
    beforeEach(async () => {
      await prisma.plan.update({
        where: {
          code_version: {
            code: "PROFESSIONAL",
            version: 1,
          },
        },
        data: {
          status: "ACTIVE",
        },
      });
    });

    afterAll(async () => {
      await prisma.plan.updateMany({
        where: {
          code: "PROFESSIONAL",
          version: 1,
        },
        data: {
          status: "ACTIVE",
        },
      });

      for (const workspaceId of createdWorkspaceIds) {
        await cleanupWorkspace(workspaceId);
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
    });

    it(
      "rejects initialization when PROFESSIONAL v1 is unavailable",
      async () => {
        const fixture =
          await createWorkspaceFixture();

        await prisma.plan.update({
          where: {
            code_version: {
              code: "PROFESSIONAL",
              version: 1,
            },
          },
          data: {
            code: "PROFESSIONAL_UNAVAILABLE",
          },
        });

        try {
          await expect(
            prisma.$transaction(
              async (transaction) =>
                initializeWorkspaceTrial(
                  transaction,
                  fixture.input,
                ),
            ),
          ).rejects.toBeInstanceOf(
            TrialPlanNotAvailableError,
          );

          expect(
            await prisma.billingAccount.count({
              where: {
                workspaceId:
                  fixture.workspace.id,
              },
            }),
          ).toBe(0);

          expect(
            await prisma.subscription.count({
              where: {
                workspaceId:
                  fixture.workspace.id,
              },
            }),
          ).toBe(0);
        } finally {
          await prisma.plan.update({
            where: {
              code_version: {
                code:
                  "PROFESSIONAL_UNAVAILABLE",
                version: 1,
              },
            },
            data: {
              code: "PROFESSIONAL",
              status: "ACTIVE",
            },
          });
        }
      },
    );

    it(
      "rejects initialization when PROFESSIONAL v1 is not active",
      async () => {
        const fixture =
          await createWorkspaceFixture();

        await prisma.plan.update({
          where: {
            code_version: {
              code: "PROFESSIONAL",
              version: 1,
            },
          },
          data: {
            status: "DRAFT",
          },
        });

        try {
          await expect(
            prisma.$transaction(
              async (transaction) =>
                initializeWorkspaceTrial(
                  transaction,
                  fixture.input,
                ),
            ),
          ).rejects.toBeInstanceOf(
            TrialPlanNotAvailableError,
          );

          expect(
            await prisma.billingAccount.count({
              where: {
                workspaceId:
                  fixture.workspace.id,
              },
            }),
          ).toBe(0);

          expect(
            await prisma.subscription.count({
              where: {
                workspaceId:
                  fixture.workspace.id,
              },
            }),
          ).toBe(0);
        } finally {
          await prisma.plan.update({
            where: {
              code_version: {
                code: "PROFESSIONAL",
                version: 1,
              },
            },
            data: {
              status: "ACTIVE",
            },
          });
        }
      },
    );

    it(
      "rejects an incompatible existing subscription",
      async () => {
        const fixture =
          await createWorkspaceFixture();

        const plan =
          await prisma.plan.findUniqueOrThrow({
            where: {
              code_version: {
                code: "PROFESSIONAL",
                version: 1,
              },
            },
            select: {
              id: true,
            },
          });

        const billingAccount =
          await prisma.billingAccount.create({
            data: {
              workspaceId:
                fixture.workspace.id,
              legalName:
                "شركة اشتراك غير متوافق",
              countryCode: "SA",
              currency: "SAR",
              language: "ar",
            },
            select: {
              id: true,
            },
          });

        const now = new Date();
        const periodEnd = new Date(
          now.getTime() +
            30 * 24 * 60 * 60 * 1000,
        );

        const existingSubscription =
          await prisma.subscription.create({
            data: {
              workspaceId:
                fixture.workspace.id,
              billingAccountId:
                billingAccount.id,
              planId: plan.id,
              initializationKey:
                `manual:${fixture.workspace.id}`,
              status: "ACTIVE",
              accessState: "FULL",
              source: "MANUAL",
              currentPeriodStartsAt: now,
              currentPeriodEndsAt: periodEnd,
            },
            select: {
              id: true,
              currentPeriodEndsAt: true,
            },
          });

        await expect(
          prisma.$transaction(
            async (transaction) =>
              initializeWorkspaceTrial(
                transaction,
                fixture.input,
              ),
          ),
        ).rejects.toBeInstanceOf(
          WorkspaceBillingAlreadyInitializedError,
        );

        const subscriptions =
          await prisma.subscription.findMany({
            where: {
              workspaceId:
                fixture.workspace.id,
            },
            select: {
              id: true,
              initializationKey: true,
              status: true,
              currentPeriodEndsAt: true,
            },
          });

        expect(subscriptions).toHaveLength(1);
        expect(subscriptions[0]?.id).toBe(
          existingSubscription.id,
        );
        expect(
          subscriptions[0]?.initializationKey,
        ).toBe(
          `manual:${fixture.workspace.id}`,
        );
        expect(subscriptions[0]?.status).toBe(
          "ACTIVE",
        );
        expect(
          subscriptions[0]?.currentPeriodEndsAt,
        ).toEqual(
          existingSubscription.currentPeriodEndsAt,
        );

        expect(
          await prisma.usageCounter.count({
            where: {
              subscriptionId:
                existingSubscription.id,
            },
          }),
        ).toBe(0);
      },
    );
  },
);
