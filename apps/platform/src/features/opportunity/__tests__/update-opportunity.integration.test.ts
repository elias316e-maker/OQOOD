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

function createUniqueId(): string {
  return [
    Date.now(),
    Math.random().toString(36).slice(2, 10),
  ].join("-");
}

describe.sequential(
  "Update Opportunity Integration",
  () => {
    let userId: string;
    let workspaceId: string;
    let secondWorkspaceId: string;
    let roleId: string;
    let updatePermissionId: string;

    beforeAll(async () => {
      const uniqueId = createUniqueId();
      const now = new Date();
      const periodEnd = new Date(
        now.getTime() +
          30 * 24 * 60 * 60 * 1000,
      );

      const user = await prisma.user.create({
        data: {
          name: "Update Opportunity User",
          email:
            `update-opportunity-${uniqueId}` +
            "@example.test",
          emailVerified: true,
          isActive: true,
        },
        select: {
          id: true,
        },
      });

      userId = user.id;

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

      const activePlanId = plan.id;

      async function createWorkspace(
        suffix: string,
      ): Promise<string> {
        const workspace =
          await prisma.workspace.create({
            data: {
              code:
                `UPDATE-OPP-${suffix}-${uniqueId}`,
              slug:
                `update-opportunity-${suffix}-${uniqueId}`,
              nameAr:
                `مساحة اختبار تحديث الفرص ${suffix}`,
              nameEn:
                `Update Opportunity Workspace ${suffix}`,
              status: "ACTIVE",
              defaultCurrency: "SAR",
              createdById: userId,
            },
            select: {
              id: true,
            },
          });

        const billingAccount =
          await prisma.billingAccount.create({
            data: {
              workspaceId: workspace.id,
              legalName:
                `Update Opportunity Company ${suffix}`,
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
            billingAccountId:
              billingAccount.id,
            planId: activePlanId,
            initializationKey:
              `update-opportunity:${suffix}:${uniqueId}`,
            status: "ACTIVE",
            accessState: "FULL",
            source: "MANUAL",
            currentPeriodStartsAt: now,
            currentPeriodEndsAt: periodEnd,
          },
        });

        return workspace.id;
      }

      workspaceId =
        await createWorkspace("PRIMARY");

      secondWorkspaceId =
        await createWorkspace("SECONDARY");

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
            `OPP-UPDATER-${uniqueId}`,
          name: "Opportunity Updater",
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
            code:
              Permissions.opportunities.update,
          },
          select: {
            id: true,
          },
        });

      if (!permission) {
        throw new Error(
          "Opportunity update permission is missing. Run Prisma seed first.",
        );
      }

      updatePermissionId = permission.id;

      await prisma.rolePermission.create({
        data: {
          roleId,
          permissionId: updatePermissionId,
        },
      });
    });

    afterAll(async () => {
      await prisma.auditLog.deleteMany({
        where: {
          workspaceId: {
            in: [
              workspaceId,
              secondWorkspaceId,
            ],
          },
        },
      });

      await prisma.workspace.deleteMany({
        where: {
          id: {
            in: [
              workspaceId,
              secondWorkspaceId,
            ],
          },
        },
      });

      await prisma.user.deleteMany({
        where: {
          id: userId,
        },
      });

      await prisma.$disconnect();
    });

    async function createOpportunity(input?: {
      status?: "DRAFT" | "ARCHIVED";
      workspaceId?: string;
    }) {
      return prisma.opportunity.create({
        data: {
          workspaceId:
            input?.workspaceId ?? workspaceId,
          number:
            `UPDATE-${createUniqueId()}`.toUpperCase(),
          title: "عنوان الفرصة الأصلي",
          description: "الوصف الأصلي",
          type: "RFQ",
          status:
            input?.status ?? "DRAFT",
          visibility: "INVITED",
          category: "CONSTRUCTION",
          priority: "NORMAL",
          budget: "100000",
          currency: "SAR",
          issueDate:
            new Date(
              "2026-08-01T00:00:00.000Z",
            ),
          closingDate:
            new Date(
              "2026-08-15T00:00:00.000Z",
            ),
          createdById: userId,
        },
      });
    }

    it(
      "updates a draft opportunity and creates an audit log",
      async () => {
        const opportunity =
          await createOpportunity();

        const service =
          new DefaultOpportunityApplicationService();

        const result = await service.update({
          workspaceId,
          actorUserId: userId,
          opportunityId: opportunity.id,
          title: "عنوان الفرصة المحدث",
          description: "وصف محدث",
          priority: "high",
          budget: "175000",
          currency: "usd",
        });

        expect(result).toMatchObject({
          id: opportunity.id,
          workspaceId,
          title: "عنوان الفرصة المحدث",
          description: "وصف محدث",
          priority: "HIGH",
          budget: "175000",
          currency: "USD",
          status: "DRAFT",
        });

        const audit =
          await prisma.auditLog.findFirst({
            where: {
              workspaceId,
              entityType: "Opportunity",
              entityId: opportunity.id,
              action: "opportunity.updated",
            },
          });

        expect(audit).not.toBeNull();
        expect(audit?.userId).toBe(userId);

        expect(audit?.metadata).toMatchObject({
          number: opportunity.number,
          changedFields: [
            "title",
            "description",
            "priority",
            "budget",
            "currency",
          ],
        });
      },
    );

    it(
      "performs a partial update without clearing existing fields",
      async () => {
        const opportunity =
          await createOpportunity();

        const service =
          new DefaultOpportunityApplicationService();

        const result = await service.update({
          workspaceId,
          actorUserId: userId,
          opportunityId: opportunity.id,
          title: "تحديث جزئي فقط",
        });

        expect(result).toMatchObject({
          title: "تحديث جزئي فقط",
          description: "الوصف الأصلي",
          category: "CONSTRUCTION",
          priority: "NORMAL",
          budget: "100000",
          currency: "SAR",
        });
      },
    );

    it(
      "rejects an update without mutable fields",
      async () => {
        const opportunity =
          await createOpportunity();

        const service =
          new DefaultOpportunityApplicationService();

        await expect(
          service.update({
            workspaceId,
            actorUserId: userId,
            opportunityId: opportunity.id,
          }),
        ).rejects.toMatchObject({
          name:
            "OpportunityUpdateFieldsRequiredError",
        });
      },
    );

    it(
      "rejects update when permission is missing",
      async () => {
        const opportunity =
          await createOpportunity();

        await prisma.rolePermission.deleteMany({
          where: {
            roleId,
            permissionId:
              updatePermissionId,
          },
        });

        const service =
          new DefaultOpportunityApplicationService();

        await expect(
          service.update({
            workspaceId,
            actorUserId: userId,
            opportunityId: opportunity.id,
            title: "تعديل غير مصرح",
          }),
        ).rejects.toMatchObject({
          name: "PermissionDeniedError",
        });

        await prisma.rolePermission.create({
          data: {
            roleId,
            permissionId:
              updatePermissionId,
          },
        });
      },
    );

    it(
      "does not expose an opportunity from another workspace",
      async () => {
        const opportunity =
          await createOpportunity({
            workspaceId: secondWorkspaceId,
          });

        const service =
          new DefaultOpportunityApplicationService();

        await expect(
          service.update({
            workspaceId,
            actorUserId: userId,
            opportunityId: opportunity.id,
            title:
              "محاولة تعديل مساحة أخرى",
          }),
        ).rejects.toMatchObject({
          name: "OpportunityNotFoundError",
        });
      },
    );

    it(
      "rejects updating an archived opportunity",
      async () => {
        const opportunity =
          await createOpportunity({
            status: "ARCHIVED",
          });

        const service =
          new DefaultOpportunityApplicationService();

        await expect(
          service.update({
            workspaceId,
            actorUserId: userId,
            opportunityId: opportunity.id,
            title:
              "لا يجب تنفيذ هذا التعديل",
          }),
        ).rejects.toMatchObject({
          name: "OpportunityArchivedError",
          opportunityId: opportunity.id,
        });
      },
    );

    it(
      "validates dates by combining existing and updated values",
      async () => {
        const opportunity =
          await createOpportunity();

        const service =
          new DefaultOpportunityApplicationService();

        await expect(
          service.update({
            workspaceId,
            actorUserId: userId,
            opportunityId: opportunity.id,
            issueDate:
              "2026-08-20T00:00:00.000Z",
          }),
        ).rejects.toMatchObject({
          name: "OpportunityValidationError",
        });

        const stored =
          await prisma.opportunity.findUnique({
            where: {
              id: opportunity.id,
            },
          });

        expect(stored?.issueDate?.toISOString()).toBe(
          "2026-08-01T00:00:00.000Z",
        );
      },
    );
  },
);
