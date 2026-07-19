import type { Prisma } from "@/generated/prisma/client";
import {
  TrialPlanNotAvailableError,
  WorkspaceBillingAlreadyInitializedError,
} from "../errors";
import type {
  InitializeWorkspaceTrialInput,
  InitializeWorkspaceTrialResult,
} from "../types";

const PROFESSIONAL_PLAN_CODE = "PROFESSIONAL";
const PROFESSIONAL_PLAN_VERSION = 1;
const INITIALIZATION_VERSION = "v1";
const MEMBERS_METER_CODE = "ACTIVE_WORKSPACE_MEMBERS";

function addUtcDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function buildPeriodKey(start: Date, end: Date): string {
  return `${start.toISOString()}:${end.toISOString()}`;
}

export async function initializeWorkspaceTrial(
  transaction: Prisma.TransactionClient,
  input: InitializeWorkspaceTrialInput,
): Promise<InitializeWorkspaceTrialResult> {
  const initializationKey =
    `workspace-trial:${input.workspaceId}:${INITIALIZATION_VERSION}`;

  const existingSubscription =
    await transaction.subscription.findUnique({
      where: {
        workspaceId: input.workspaceId,
      },
      include: {
        plan: {
          select: {
            id: true,
            code: true,
            version: true,
          },
        },
        usageCounters: {
          select: {
            id: true,
          },
        },
      },
    });

  if (existingSubscription) {
    const trialStartsAt = existingSubscription.trialStartsAt;
    const trialEndsAt = existingSubscription.trialEndsAt;

    const isCompatible =
      existingSubscription.initializationKey === initializationKey &&
      existingSubscription.plan.code === PROFESSIONAL_PLAN_CODE &&
      existingSubscription.plan.version === PROFESSIONAL_PLAN_VERSION &&
      existingSubscription.status === "TRIALING" &&
      existingSubscription.accessState === "FULL" &&
      trialStartsAt !== null &&
      trialEndsAt !== null;

    if (!isCompatible || !trialStartsAt || !trialEndsAt) {
      throw new WorkspaceBillingAlreadyInitializedError(
        input.workspaceId,
      );
    }

    return {
      billingAccountId: existingSubscription.billingAccountId,
      subscriptionId: existingSubscription.id,
      planId: existingSubscription.plan.id,
      planCode: existingSubscription.plan.code,
      planVersion: existingSubscription.plan.version,
      subscriptionStatus: "TRIALING",
      workspaceAccessState: "FULL",
      trialStartsAt,
      trialEndsAt,
      usageCounterIds:
        existingSubscription.usageCounters.map(
          (counter) => counter.id,
        ),
    };
  }

  const plan = await transaction.plan.findUnique({
    where: {
      code_version: {
        code: PROFESSIONAL_PLAN_CODE,
        version: PROFESSIONAL_PLAN_VERSION,
      },
    },
    select: {
      id: true,
      code: true,
      version: true,
      status: true,
      isDefaultTrial: true,
      trialDays: true,
    },
  });

  if (
    !plan ||
    plan.status !== "ACTIVE" ||
    !plan.isDefaultTrial ||
    plan.trialDays <= 0
  ) {
    throw new TrialPlanNotAvailableError();
  }

  const now = new Date();
  const trialEndsAt = addUtcDays(now, plan.trialDays);
  const periodKey = buildPeriodKey(now, trialEndsAt);

  const billingAccount =
    await transaction.billingAccount.upsert({
      where: {
        workspaceId: input.workspaceId,
      },
      update: {},
      create: {
        workspaceId: input.workspaceId,
        legalName: input.companyName,
        countryCode: input.countryCode,
        currency: input.currency,
        language: input.language,
        metadata: {
          initializedByUserId: input.ownerUserId,
          workspaceName: input.workspaceName,
          source: "WORKSPACE_BOOTSTRAP",
        },
      },
      select: {
        id: true,
      },
    });

  const subscription = await transaction.subscription.create({
    data: {
      workspaceId: input.workspaceId,
      billingAccountId: billingAccount.id,
      planId: plan.id,
      initializationKey,
      status: "TRIALING",
      accessState: "FULL",
      source: "SYSTEM_TRIAL",
      trialStartsAt: now,
      trialEndsAt,
      currentPeriodStartsAt: now,
      currentPeriodEndsAt: trialEndsAt,
      metadata: {
        initializedByUserId: input.ownerUserId,
      },
    },
    select: {
      id: true,
    },
  });

  const activeMeters = await transaction.usageMeter.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      code: true,
      initialValue: true,
    },
  });

  const usageCounters = await Promise.all(
    activeMeters.map((meter) =>
      transaction.usageCounter.create({
        data: {
          workspaceId: input.workspaceId,
          subscriptionId: subscription.id,
          meterId: meter.id,
          periodKey,
          periodStartsAt: now,
          periodEndsAt: trialEndsAt,
          value:
            meter.code === MEMBERS_METER_CODE
              ? 1
              : meter.initialValue,
          metadata: {
            initializedBy: "WORKSPACE_TRIAL",
          },
        },
        select: {
          id: true,
        },
      }),
    ),
  );

  return {
    billingAccountId: billingAccount.id,
    subscriptionId: subscription.id,
    planId: plan.id,
    planCode: plan.code,
    planVersion: plan.version,
    subscriptionStatus: "TRIALING",
    workspaceAccessState: "FULL",
    trialStartsAt: now,
    trialEndsAt,
    usageCounterIds: usageCounters.map((counter) => counter.id),
  };
}
