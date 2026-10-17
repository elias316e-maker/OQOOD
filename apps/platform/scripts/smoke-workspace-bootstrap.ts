import "dotenv/config";

import { prisma } from "../src/lib/prisma";
import { DefaultWorkspaceBootstrapService } from "../src/features/workspace/services";
import { WorkspaceAlreadyExistsError } from "../src/features/workspace/services";

const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const testEmail = `workspace-bootstrap-${uniqueId}@example.test`;

let userId: string | undefined;
let workspaceId: string | undefined;

async function main() {
  const user = await prisma.user.create({
    data: {
      name: "Workspace Bootstrap Test",
      email: testEmail,
      emailVerified: true,
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  userId = user.id;

  const service = new DefaultWorkspaceBootstrapService();

  const result = await service.execute(user.id, {
    workspaceNameAr: "مساحة اختبار التهيئة",
    workspaceNameEn: `Bootstrap Test ${uniqueId}`,
    companyNameAr: "شركة اختبار التهيئة",
    companyNameEn: "Bootstrap Test Company",
    commercialRegister: `TEST-${uniqueId}`,
    countryCode: "SA",
    timezone: "Asia/Riyadh",
    defaultLanguage: "ar",
    defaultCurrency: "SAR",
  });

  workspaceId = result.workspace.id;

  console.log("BOOTSTRAP RESULT:");
  console.dir(result, { depth: null });

  const persisted = await prisma.workspace.findUnique({
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
          action: "workspace.bootstrap.completed",
        },
      },
    },
  });

  if (!persisted) {
    throw new Error("Workspace was not persisted.");
  }

  if (persisted.companies.length !== 1) {
    throw new Error(
      `Expected one company, found ${persisted.companies.length}.`,
    );
  }

  if (persisted.members.length !== 1) {
    throw new Error(
      `Expected one owner membership, found ${persisted.members.length}.`,
    );
  }

  const ownerRoleAssigned = persisted.members[0]?.roles.some(
    (assignment) => assignment.role.code === "OWNER",
  );

  if (!ownerRoleAssigned) {
    throw new Error("OWNER role was not assigned.");
  }

  if (!persisted.billingAccount) {
    throw new Error("BillingAccount was not created.");
  }

  if (!persisted.subscription) {
    throw new Error("Subscription was not created.");
  }

  if (persisted.subscription.plan.code !== "PROFESSIONAL") {
    throw new Error("Expected PROFESSIONAL plan.");
  }

  if (persisted.subscription.plan.version !== 1) {
    throw new Error("Expected PROFESSIONAL plan version 1.");
  }

  if (persisted.subscription.status !== "TRIALING") {
    throw new Error("Expected TRIALING subscription.");
  }

  if (persisted.subscription.accessState !== "FULL") {
    throw new Error("Expected FULL workspace access.");
  }

  const trialStartsAt = persisted.subscription.trialStartsAt;
  const trialEndsAt = persisted.subscription.trialEndsAt;

  if (!trialStartsAt || !trialEndsAt) {
    throw new Error("Trial dates were not created.");
  }

  const trialDurationDays =
    (trialEndsAt.getTime() - trialStartsAt.getTime()) /
    (24 * 60 * 60 * 1000);

  if (trialDurationDays !== 30) {
    throw new Error(
      `Expected a 30-day trial, found ${trialDurationDays} days.`,
    );
  }

  if (persisted.subscription.usageCounters.length !== 5) {
    throw new Error(
      `Expected 5 usage counters, found ${persisted.subscription.usageCounters.length}.`,
    );
  }

  const memberCounter =
    persisted.subscription.usageCounters.find(
      (counter) =>
        counter.meter.code === "ACTIVE_WORKSPACE_MEMBERS",
    );

  if (!memberCounter || memberCounter.value.toString() !== "1") {
    throw new Error(
      "ACTIVE_WORKSPACE_MEMBERS must start with value 1.",
    );
  }

  if (persisted.auditLogs.length !== 1) {
    throw new Error(
      `Expected one bootstrap AuditLog, found ${persisted.auditLogs.length}.`,
    );
  }

  console.log("PERSISTED WORKSPACE SUMMARY:");
  console.dir(
    {
      workspaceId: persisted.id,
      companyId: persisted.companies[0]?.id,
      ownerMembershipId: persisted.members[0]?.id,
      billingAccountId: persisted.billingAccount.id,
      subscriptionId: persisted.subscription.id,
      plan: `${persisted.subscription.plan.code} v${persisted.subscription.plan.version}`,
      status: persisted.subscription.status,
      accessState: persisted.subscription.accessState,
      trialDurationDays,
      usageCounters:
        persisted.subscription.usageCounters.map((counter) => ({
          meter: counter.meter.code,
          value: counter.value.toString(),
        })),
      auditLogId: persisted.auditLogs[0]?.id,
    },
    { depth: null },
  );

  try {
    await service.execute(user.id, {
      workspaceNameAr: "مساحة مكررة",
      companyNameAr: "شركة مكررة",
      countryCode: "SA",
      timezone: "Asia/Riyadh",
      defaultLanguage: "ar",
      defaultCurrency: "SAR",
    });

    throw new Error(
      "Repeated first-run bootstrap unexpectedly succeeded.",
    );
  } catch (error) {
    if (!(error instanceof WorkspaceAlreadyExistsError)) {
      throw error;
    }

    console.log(
      "DUPLICATE FIRST-RUN PROTECTION: SUCCESS",
    );
  }

  console.log("WORKSPACE BOOTSTRAP SMOKE TEST: SUCCESS");
}

async function cleanup() {
  if (workspaceId) {
    await prisma.auditLog.deleteMany({
      where: { workspaceId },
    });

    await prisma.subscription.deleteMany({
      where: { workspaceId },
    });

    await prisma.billingAccount.deleteMany({
      where: { workspaceId },
    });

    await prisma.workspace.deleteMany({
      where: { id: workspaceId },
    });
  }

  if (userId) {
    await prisma.user.deleteMany({
      where: { id: userId },
    });
  }
}

main()
  .catch((error) => {
    console.error("WORKSPACE BOOTSTRAP SMOKE TEST: FAILED");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await cleanup();
      console.log("TEST DATA CLEANUP: SUCCESS");
    } catch (cleanupError) {
      console.error("TEST DATA CLEANUP: FAILED");
      console.error(cleanupError);
      process.exitCode = 1;
    } finally {
      await prisma.$disconnect();
    }
  });
