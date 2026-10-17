import type {
  Opportunity,
  OpportunityStatus,
  OpportunityType,
  OpportunityVisibility,
  WorkspaceAccessState,
} from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";
import type {
  PermissionCode,
} from "@/lib/permissions";

import {
  createPermissionTestContext,
  createTestId,
} from "@/testing";


export type CreateTestOpportunityInput = {
  workspaceId?: string;
  createdById?: string;
  number?: string;
  title?: string;
  description?: string | null;
  type?: OpportunityType;
  status?: OpportunityStatus;
  visibility?: OpportunityVisibility;
  category?: string | null;
  priority?: string;
  budget?: string | null;
  currency?: string;
  issueDate?: Date | null;
  closingDate?: Date | null;
  publishedAt?: Date | null;
  closedAt?: Date | null;
};

export type OpportunityTestContext = {
  uniqueId: string;
  userId: string;
  workspaceId: string;
  roleId: string;

  createOpportunity(
    input?: CreateTestOpportunityInput,
  ): Promise<Opportunity>;

  grantPermission(
    permission: PermissionCode,
  ): Promise<void>;

  revokePermission(
    permission: PermissionCode,
  ): Promise<void>;

  setWorkspaceAccessState(
    accessState: WorkspaceAccessState,
  ): Promise<void>;

  cleanup(): Promise<void>;
};

export async function createOpportunityTestContext(
  permissions: PermissionCode[] = [],
): Promise<OpportunityTestContext> {
  const uniqueId = createTestId();
  const now = new Date();
  const periodEnd = new Date(
    now.getTime() +
      30 * 24 * 60 * 60 * 1000,
  );

  const user = await prisma.user.create({
    data: {
      name: "Opportunity Test User",
      email:
        `opportunity-test-${uniqueId}` +
        "@example.test",
      emailVerified: true,
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  const workspace = await prisma.workspace.create({
    data: {
      code: `OPP-TEST-${uniqueId}`,
      slug: `opportunity-test-${uniqueId}`,
      nameAr: "مساحة اختبار الفرص",
      nameEn: "Opportunity Test Workspace",
      status: "ACTIVE",
      defaultCurrency: "SAR",
      createdById: user.id,
    },
    select: {
      id: true,
    },
  });

  const plan = await prisma.plan.findFirst({
    where: {
      status: "ACTIVE",
    },
    select: {
      id: true,
    },
  });

  if (!plan) {
    throw new Error(
      "Active plan is required. Run Prisma seed first.",
    );
  }

  const billingAccount =
    await prisma.billingAccount.create({
      data: {
        workspaceId: workspace.id,
        legalName:
          "Opportunity Test Company",
        countryCode: "SA",
        currency: "SAR",
        language: "ar",
      },
      select: {
        id: true,
      },
    });

  await prisma.subscription.create({
    data: {
      workspaceId: workspace.id,
      billingAccountId: billingAccount.id,
      planId: plan.id,
      initializationKey:
        `opportunity-test:${uniqueId}`,
      status: "ACTIVE",
      accessState: "FULL",
      source: "MANUAL",
      currentPeriodStartsAt: now,
      currentPeriodEndsAt: periodEnd,
    },
  });

  const membership =
    await prisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        status: "ACTIVE",
      },
      select: {
        id: true,
      },
    });

  const role = await prisma.role.create({
    data: {
      workspaceId: workspace.id,
      code: `OPP-TEST-ROLE-${uniqueId}`,
      name: "Opportunity Test Role",
      isSystem: false,
    },
    select: {
      id: true,
    },
  });

  await prisma.workspaceMemberRole.create({
    data: {
      workspaceMemberId: membership.id,
      roleId: role.id,
    },
  });

  const permissionContext =
    createPermissionTestContext(
      role.id,
    );

  await Promise.all(
    permissions.map(
      permissionContext.grantPermission,
    ),
  );

  async function createOpportunity(
    input: CreateTestOpportunityInput = {},
  ): Promise<Opportunity> {
    const number =
      input.number ??
      `OPP-${createTestId()}`;

    return prisma.opportunity.create({
      data: {
        workspaceId:
          input.workspaceId ?? workspace.id,
        createdById:
          input.createdById ?? user.id,
        number: number.toUpperCase(),
        title:
          input.title ??
          "فرصة اختبار افتراضية",
        description:
          input.description ??
          "وصف فرصة الاختبار",
        type: input.type ?? "RFQ",
        status: input.status ?? "DRAFT",
        visibility:
          input.visibility ?? "INVITED",
        category:
          input.category ?? "CONSTRUCTION",
        priority:
          input.priority ?? "NORMAL",
        budget:
          input.budget === undefined
            ? "100000"
            : input.budget,
        currency:
          input.currency ?? "SAR",
        issueDate:
          input.issueDate === undefined
            ? new Date(
                "2026-08-01T00:00:00.000Z",
              )
            : input.issueDate,
        closingDate:
          input.closingDate === undefined
            ? new Date(
                "2099-08-15T00:00:00.000Z",
              )
            : input.closingDate,
        publishedAt:
          input.publishedAt ?? null,
        closedAt:
          input.closedAt ?? null,
      },
    });
  }

  async function setWorkspaceAccessState(
    accessState: WorkspaceAccessState,
  ): Promise<void> {
    await prisma.subscription.update({
      where: {
        workspaceId: workspace.id,
      },
      data: {
        accessState,
      },
    });
  }

  async function cleanup(): Promise<void> {
    await prisma.auditLog.deleteMany({
      where: {
        workspaceId: workspace.id,
      },
    });

    await prisma.workspace.deleteMany({
      where: {
        id: workspace.id,
      },
    });

    await prisma.user.deleteMany({
      where: {
        id: user.id,
      },
    });
  }

  return {
    uniqueId,
    userId: user.id,
    workspaceId: workspace.id,
    roleId: role.id,
    createOpportunity,
    grantPermission:
      permissionContext.grantPermission,
    revokePermission:
      permissionContext.revokePermission,
    setWorkspaceAccessState,
    cleanup,
  };
}
