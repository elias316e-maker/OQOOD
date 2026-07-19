import "dotenv/config";

import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import { initializeWorkspaceTrial } from "@/features/billing";
import { prisma } from "@/lib/prisma";

function createUniqueId(): string {
  return [
    Date.now(),
    Math.random().toString(36).slice(2, 10),
  ].join("-");
}

describe.sequential(
  "initializeWorkspaceTrial idempotency",
  () => {
    let userId: string | undefined;
    let workspaceId: string | undefined;

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
        },
      });

      if (
        !plan ||
        plan.status !== "ACTIVE" ||
        plan.trialDays !== 30
      ) {
        throw new Error(
          "PROFESSIONAL v1 must be ACTIVE with a 30-day trial. Run Prisma seed first.",
        );
      }

      const activeMeters =
        await prisma.usageMeter.count({
          where: {
            isActive: true,
          },
        });

      if (activeMeters === 0) {
        throw new Error(
          "No active Usage Meters were found. Run Prisma seed first.",
        );
      }
    });

    afterAll(async () => {
      if (workspaceId) {
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

      if (userId) {
        await prisma.user.deleteMany({
          where: {
            id: userId,
          },
        });
      }
    });

    it(
      "returns the existing trial without extending or resetting it",
      async () => {
        const uniqueId = createUniqueId();

        const user = await prisma.user.create({
          data: {
            name: "Billing Idempotency Test",
            email:
              `billing-idempotency-${uniqueId}` +
              "@example.test",
            emailVerified: true,
            isActive: true,
          },
          select: {
            id: true,
          },
        });

        userId = user.id;

        const workspace =
          await prisma.workspace.create({
            data: {
              code:
                `BILLING-IDEMPOTENCY-${uniqueId}`
                  .toUpperCase()
                  .slice(0, 60),
              slug:
                `billing-idempotency-${uniqueId}`
                  .toLowerCase()
                  .slice(0, 80),
              nameAr:
                "مساحة اختبار ثبات التهيئة التجارية",
              nameEn:
                "Billing Idempotency Workspace",
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

        workspaceId = workspace.id;

        const initializationInput = {
          workspaceId: workspace.id,
          ownerUserId: user.id,
          workspaceName:
            "مساحة اختبار ثبات التهيئة التجارية",
          companyName:
            "شركة اختبار ثبات التهيئة التجارية",
          countryCode: "SA",
          currency: "SAR",
          language: "ar",
        };

        const firstResult =
          await prisma.$transaction(
            async (transaction) =>
              initializeWorkspaceTrial(
                transaction,
                initializationInput,
              ),
          );

        const firstState =
          await prisma.subscription.findUnique({
            where: {
              workspaceId: workspace.id,
            },
            include: {
              usageCounters: {
                include: {
                  meter: true,
                },
                orderBy: {
                  meterId: "asc",
                },
              },
            },
          });

        expect(firstState).not.toBeNull();

        if (!firstState) {
          throw new Error(
            "First Subscription was not persisted.",
          );
        }

        const counterToModify =
          firstState.usageCounters.find(
            (counter) =>
              counter.meter.code !==
              "ACTIVE_WORKSPACE_MEMBERS",
          );

        expect(counterToModify).toBeDefined();

        if (!counterToModify) {
          throw new Error(
            "A non-member Usage Counter is required for the idempotency test.",
          );
        }

        await prisma.usageCounter.update({
          where: {
            id: counterToModify.id,
          },
          data: {
            value: 7,
          },
        });

        const billingAccountsBefore =
          await prisma.billingAccount.count({
            where: {
              workspaceId: workspace.id,
            },
          });

        const subscriptionsBefore =
          await prisma.subscription.count({
            where: {
              workspaceId: workspace.id,
            },
          });

        const countersBefore =
          await prisma.usageCounter.count({
            where: {
              subscriptionId: firstState.id,
            },
          });

        const secondResult =
          await prisma.$transaction(
            async (transaction) =>
              initializeWorkspaceTrial(
                transaction,
                initializationInput,
              ),
          );

        const secondState =
          await prisma.subscription.findUnique({
            where: {
              workspaceId: workspace.id,
            },
            include: {
              usageCounters: {
                include: {
                  meter: true,
                },
              },
            },
          });

        expect(secondState).not.toBeNull();

        if (!secondState) {
          throw new Error(
            "Subscription disappeared after retry.",
          );
        }

        const billingAccountsAfter =
          await prisma.billingAccount.count({
            where: {
              workspaceId: workspace.id,
            },
          });

        const subscriptionsAfter =
          await prisma.subscription.count({
            where: {
              workspaceId: workspace.id,
            },
          });

        const countersAfter =
          await prisma.usageCounter.count({
            where: {
              subscriptionId: secondState.id,
            },
          });

        const modifiedCounterAfterRetry =
          secondState.usageCounters.find(
            (counter) =>
              counter.id === counterToModify.id,
          );

        expect(firstResult.billingAccountId).toBe(
          secondResult.billingAccountId,
        );

        expect(firstResult.subscriptionId).toBe(
          secondResult.subscriptionId,
        );

        expect(firstState.id).toBe(secondState.id);

        expect(
          secondState.initializationKey,
        ).toBe(
          `workspace-trial:${workspace.id}:v1`,
        );

        expect(secondState.trialStartsAt).toEqual(
          firstState.trialStartsAt,
        );

        expect(secondState.trialEndsAt).toEqual(
          firstState.trialEndsAt,
        );

        expect(
          secondState.currentPeriodStartsAt,
        ).toEqual(
          firstState.currentPeriodStartsAt,
        );

        expect(
          secondState.currentPeriodEndsAt,
        ).toEqual(
          firstState.currentPeriodEndsAt,
        );

        expect(billingAccountsBefore).toBe(1);
        expect(billingAccountsAfter).toBe(1);

        expect(subscriptionsBefore).toBe(1);
        expect(subscriptionsAfter).toBe(1);

        expect(countersAfter).toBe(countersBefore);

        expect(
          modifiedCounterAfterRetry?.value.toString(),
        ).toBe("7");

        expect(
          secondState.usageCounters.map(
            (counter) => counter.id,
          ).sort(),
        ).toEqual(
          firstState.usageCounters.map(
            (counter) => counter.id,
          ).sort(),
        );
      },
    );
  },
);
