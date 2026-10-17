import "dotenv/config";

import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import { prisma } from "@/lib/prisma";
import { Permissions } from "@/lib/permissions";

import {
  DefaultOpportunityApplicationService,
} from "../services";

import {
  ThrowingOpportunityUpdateAuditRepository,
} from "./fakes/throwing-opportunity-update-audit.repository";

function createUniqueId(): string {
  return [
    Date.now(),
    Math.random().toString(36).slice(2, 10),
  ].join("-");
}

describe.sequential(
  "Update Opportunity Audit Rollback",
  () => {
    let userId: string;
    let workspaceId: string;

    beforeAll(async () => {
      const uniqueId = createUniqueId();
      const now = new Date();
      const periodEnd = new Date(
        now.getTime() +
          30 * 24 * 60 * 60 * 1000,
      );

      const user = await prisma.user.create({
        data: {
          name:
            "Update Opportunity Rollback User",
          email:
            `update-opportunity-rollback-${uniqueId}` +
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
              `UPDATE-ROLLBACK-${uniqueId}`,
            slug:
              `update-rollback-${uniqueId}`,
            nameAr:
              "مساحة اختبار تراجع تحديث الفرص",
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
          "Active plan is required.",
        );
      }

      const billingAccount =
        await prisma.billingAccount.create({
          data: {
            workspaceId,
            legalName:
              "Update Rollback Company",
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
          workspaceId,
          billingAccountId:
            billingAccount.id,
          planId: plan.id,
          initializationKey:
            `update-rollback:${uniqueId}`,
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
            `UPDATE-ROLLBACK-ROLE-${uniqueId}`,
          name:
            "Update Rollback Role",
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
              Permissions.opportunities.update,
          },
          select: {
            id: true,
          },
        });

      if (!permission) {
        throw new Error(
          "Opportunity update permission is missing.",
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
      "rolls back the update when audit logging fails",
      async () => {
        const opportunity =
          await prisma.opportunity.create({
            data: {
              workspaceId,
              number:
                `UPDATE-ROLLBACK-${createUniqueId()}`.toUpperCase(),
              title: "العنوان قبل التعديل",
              description: "الوصف قبل التعديل",
              type: "RFQ",
              status: "DRAFT",
              visibility: "INVITED",
              priority: "NORMAL",
              currency: "SAR",
              createdById: userId,
            },
          });

        const service =
          new DefaultOpportunityApplicationService(
            new ThrowingOpportunityUpdateAuditRepository(),
          );

        await expect(
          service.update({
            workspaceId,
            actorUserId: userId,
            opportunityId: opportunity.id,
            title: "العنوان بعد التعديل",
          }),
        ).rejects.toThrow(
          "Injected Opportunity Update Audit Failure",
        );

        const stored =
          await prisma.opportunity.findUnique({
            where: {
              id: opportunity.id,
            },
          });

        expect(stored?.title).toBe(
          "العنوان قبل التعديل",
        );

        const auditCount =
          await prisma.auditLog.count({
            where: {
              workspaceId,
              entityId: opportunity.id,
              action: "opportunity.updated",
            },
          });

        expect(auditCount).toBe(0);
      },
    );
  },
);
