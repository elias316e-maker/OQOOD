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
  Permissions,
} from "@/lib/permissions";

import {
  DefaultOpportunityApplicationService,
} from "../services";

function createUniqueId(): string {
  return [
    Date.now(),
    Math.random().toString(36).slice(2, 10),
  ].join("-");
}

describe.sequential(
  "Create Opportunity Integration",
  () => {
    let userId: string;
    let workspaceId: string;
    let permissionId: string;
    let roleId: string;

    beforeAll(async () => {
      const uniqueId = createUniqueId();

      const user = await prisma.user.create({
        data: {
          name: "Create Opportunity User",
          email:
            `create-opportunity-${uniqueId}` +
            "@example.test",
          emailVerified: true,
          isActive: true,
        },
        select: {
          id: true,
        },
      });

      userId = user.id;

      const workspace = await prisma.workspace.create({
        data: {
          code: `CREATE-OPP-${uniqueId}`,
          slug: `create-opportunity-${uniqueId}`,
          nameAr: "مساحة اختبار إنشاء الفرص",
          nameEn: "Create Opportunity Workspace",
          status: "ACTIVE",
          defaultCurrency: "SAR",
          createdById: userId,
        },
        select: {
          id: true,
        },
      });

      workspaceId = workspace.id;

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
            workspaceId,
            legalName:
              "Create Opportunity Test Company",
            countryCode: "SA",
            currency: "SAR",
            language: "ar",
          },
          select: {
            id: true,
          },
        });

      const now = new Date();

      await prisma.subscription.create({
        data: {
          workspaceId,
          billingAccountId: billingAccount.id,
          planId: plan.id,
          initializationKey:
            `create-opportunity:${uniqueId}`,
          status: "ACTIVE",
          accessState: "FULL",
          source: "MANUAL",

          currentPeriodStartsAt: now,
          currentPeriodEndsAt: new Date(
            now.getTime() + 30 * 24 * 60 * 60 * 1000,
          ),
        },
      });

      const membership =
        await prisma.workspaceMember.create({
          data: {
            workspaceId,
            userId,
            status: "ACTIVE",
          },
          select: {
            id: true,
          },
        });

      const role = await prisma.role.create({
        data: {
          workspaceId,
          code: `OPP-CREATOR-${uniqueId}`,
          name: "Opportunity Creator",
          isSystem: false,
        },
        select: {
          id: true,
        },
      });

      roleId = role.id;

      await prisma.workspaceMemberRole.create({
        data: {
          workspaceMemberId: membership.id,
          roleId,
        },
      });

      const permission =
        await prisma.permission.findUnique({
          where: {
            code: Permissions.opportunities.create,
          },
          select: {
            id: true,
          },
        });

      if (!permission) {
        throw new Error(
          "Opportunity create permission is missing. Run Prisma seed first.",
        );
      }

      permissionId = permission.id;

      await prisma.rolePermission.create({
        data: {
          roleId,
          permissionId,
        },
      });
    });

    afterAll(async () => {
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

      await prisma.user.deleteMany({
        where: {
          id: userId,
        },
      });

      await prisma.$disconnect();
    });

    it(
      "creates a draft opportunity and audit log atomically",
      async () => {
        const number =
          `RFQ-${createUniqueId()}`;
        const normalizedNumber = number.toUpperCase();

        const service =
          new DefaultOpportunityApplicationService();

        const result = await service.create({
          workspaceId,
          actorUserId: userId,
          number: number.toUpperCase(),
          title: "توريد مواد إنشائية",
          description:
            "توريد مواد لمشروع داخل الرياض",
          type: "RFQ",
          visibility: "INVITED",
          priority: "HIGH",
          budget: "250000",
          issueDate:
            "2026-08-01T00:00:00.000Z",
          closingDate:
            "2026-08-15T00:00:00.000Z",
        });

        expect(result).toMatchObject({
          workspaceId,
          number: normalizedNumber,
          title: "توريد مواد إنشائية",
          type: "RFQ",
          status: "DRAFT",
          visibility: "INVITED",
          priority: "HIGH",
          budget: "250000",
          currency: "SAR",
          createdById: userId,
        });

        const opportunity =
          await prisma.opportunity.findUnique({
            where: {
              id: result.id,
            },
          });

        expect(opportunity).not.toBeNull();

        const audit =
          await prisma.auditLog.findFirst({
            where: {
              workspaceId,
              entityType: "Opportunity",
              entityId: result.id,
              action: "opportunity.created",
            },
          });

        expect(audit).not.toBeNull();
        expect(audit?.userId).toBe(userId);
      },
    );

    it(
      "uses the workspace default currency when omitted",
      async () => {
        const service =
          new DefaultOpportunityApplicationService();

        const result = await service.create({
          workspaceId,
          actorUserId: userId,
          number:
            `RFP-${createUniqueId()}`,
          title: "خدمات استشارية",
          type: "RFP",
        });

        expect(result.currency).toBe("SAR");
      },
    );

    it(
      "rejects duplicate opportunity numbers in the same workspace",
      async () => {
        const number =
          `DUPLICATE-${createUniqueId()}`;
        const normalizedNumber = number.toUpperCase();

        const service =
          new DefaultOpportunityApplicationService();

        await service.create({
          workspaceId,
          actorUserId: userId,
          number: normalizedNumber,
          title: "الفرصة الأصلية",
          type: "RFQ",
        });

        await expect(
          service.create({
            workspaceId,
            actorUserId: userId,
            number,
            title: "فرصة مكررة",
            type: "RFQ",
          }),
        ).rejects.toMatchObject({
          name:
            "OpportunityNumberAlreadyExistsError",
          number: number.toUpperCase(),
        });

        const count =
          await prisma.opportunity.count({
            where: {
              workspaceId,
              number: normalizedNumber,
            },
          });

        expect(count).toBe(1);
      },
    );

    it(
      "rejects creation when the permission is missing",
      async () => {
        await prisma.rolePermission.deleteMany({
          where: {
            roleId,
            permissionId,
          },
        });

        const service =
          new DefaultOpportunityApplicationService();

        await expect(
          service.create({
            workspaceId,
            actorUserId: userId,
            number:
              `DENIED-${createUniqueId()}`,
            title: "فرصة دون صلاحية",
            type: "RFQ",
          }),
        ).rejects.toMatchObject({
          name: "PermissionDeniedError",
        });

        await prisma.rolePermission.create({
          data: {
            roleId,
            permissionId,
          },
        });
      },
    );

    it(
      "rejects creation when workspace access is read-only",
      async () => {
        await prisma.subscription.update({
          where: {
            workspaceId,
          },
          data: {
            accessState: "READ_ONLY",
          },
        });

        const service =
          new DefaultOpportunityApplicationService();

        await expect(
          service.create({
            workspaceId,
            actorUserId: userId,
            number:
              `READONLY-${createUniqueId()}`,
            title: "فرصة في وضع القراءة",
            type: "RFQ",
          }),
        ).rejects.toMatchObject({
          name:
            "WorkspaceWriteAccessDeniedError",
          reason: "WORKSPACE_READ_ONLY",
        });

        await prisma.subscription.update({
          where: {
            workspaceId,
          },
          data: {
            accessState: "FULL",
          },
        });
      },
    );
  },
);
