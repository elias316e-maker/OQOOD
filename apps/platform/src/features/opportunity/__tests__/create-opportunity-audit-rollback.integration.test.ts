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

import {
  ThrowingOpportunityAuditRepository,
} from "./fakes/throwing-opportunity-audit.repository";

function createUniqueId(): string {
  return [
    Date.now(),
    Math.random().toString(36).slice(2, 10),
  ].join("-");
}

describe.sequential(
  "Create Opportunity Audit Rollback",
  () => {
    let userId: string;
    let workspaceId: string;

    beforeAll(async () => {
      const uniqueId = createUniqueId();

      const user = await prisma.user.create({
        data: {
          name:
            "Opportunity Audit Rollback User",
          email:
            `opportunity-audit-rollback-${uniqueId}` +
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
          code: `OPP-ROLLBACK-${uniqueId}`,
          slug:
            `opportunity-rollback-${uniqueId}`,
          nameAr:
            "مساحة اختبار تراجع الفرص",
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
              "Opportunity Rollback Company",
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
            `opportunity-rollback:${uniqueId}`,
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
          code:
            `OPP-ROLLBACK-ROLE-${uniqueId}`,
          name:
            "Opportunity Rollback Role",
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

      const permission =
        await prisma.permission.findUnique({
          where: {
            code:
              Permissions.opportunities.create,
          },
          select: {
            id: true,
          },
        });

      if (!permission) {
        throw new Error(
          "Opportunity permission is missing.",
        );
      }

      await prisma.rolePermission.create({
        data: {
          roleId: role.id,
          permissionId: permission.id,
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
      "rolls back opportunity creation when audit log creation fails",
      async () => {
        const number =
          `ROLLBACK-${createUniqueId()}`;

        const service =
          new DefaultOpportunityApplicationService(
            new ThrowingOpportunityAuditRepository(),
          );

        await expect(
          service.create({
            workspaceId,
            actorUserId: userId,
            number,
            title:
              "فرصة يجب التراجع عنها",
            type: "RFQ",
          }),
        ).rejects.toThrow(
          "Injected Opportunity Audit Failure",
        );

        const [
          opportunityCount,
          auditCount,
        ] = await Promise.all([
          prisma.opportunity.count({
            where: {
              workspaceId,
              number,
            },
          }),

          prisma.auditLog.count({
            where: {
              workspaceId,
              action:
                "opportunity.created",
            },
          }),
        ]);

        expect({
          opportunityCount,
          auditCount,
        }).toEqual({
          opportunityCount: 0,
          auditCount: 0,
        });
      },
    );
  },
);
