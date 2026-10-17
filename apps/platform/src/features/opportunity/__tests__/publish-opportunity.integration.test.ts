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
  createOpportunityTestContext,
  type OpportunityTestContext,
} from "./builders";

describe.sequential(
  "Publish Opportunity Integration",
  () => {
    let context: OpportunityTestContext;
    let foreignContext: OpportunityTestContext;

    beforeAll(async () => {
      context =
        await createOpportunityTestContext([
          Permissions.opportunities.publish,
        ]);

      foreignContext =
        await createOpportunityTestContext([
          Permissions.opportunities.publish,
        ]);
    });

    afterAll(async () => {
      await foreignContext.cleanup();
      await context.cleanup();
      await prisma.$disconnect();
    });

    it(
      "publishes a draft opportunity and creates an audit log",
      async () => {
        const opportunity =
          await context.createOpportunity({
            status: "DRAFT",
          });

        const service =
          new DefaultOpportunityApplicationService();

        const result = await service.publish({
          workspaceId: context.workspaceId,
          actorUserId: context.userId,
          opportunityId: opportunity.id,
        });

        expect(result).toMatchObject({
          id: opportunity.id,
          workspaceId: context.workspaceId,
          status: "PUBLISHED",
        });

        expect(result.publishedAt).not.toBeNull();

        const stored =
          await prisma.opportunity.findUnique({
            where: {
              id: opportunity.id,
            },
          });

        expect(stored?.status).toBe("PUBLISHED");
        expect(stored?.publishedAt).toBeInstanceOf(
          Date,
        );

        const audit =
          await prisma.auditLog.findFirst({
            where: {
              workspaceId: context.workspaceId,
              entityType: "Opportunity",
              entityId: opportunity.id,
              action: "opportunity.published",
            },
          });

        expect(audit).not.toBeNull();
        expect(audit?.userId).toBe(
          context.userId,
        );

        expect(audit?.metadata).toMatchObject({
          number: opportunity.number,
          previousStatus: "DRAFT",
          targetStatus: "PUBLISHED",
        });
      },
    );

    it(
      "publishes an approved opportunity",
      async () => {
        const opportunity =
          await context.createOpportunity({
            status: "APPROVED",
          });

        const service =
          new DefaultOpportunityApplicationService();

        const result = await service.publish({
          workspaceId: context.workspaceId,
          actorUserId: context.userId,
          opportunityId: opportunity.id,
        });

        expect(result.status).toBe("PUBLISHED");
        expect(result.publishedAt).not.toBeNull();

        const audit =
          await prisma.auditLog.findFirst({
            where: {
              workspaceId: context.workspaceId,
              entityId: opportunity.id,
              action: "opportunity.published",
            },
          });

        expect(audit?.metadata).toMatchObject({
          previousStatus: "APPROVED",
          targetStatus: "PUBLISHED",
        });
      },
    );

    it(
      "rejects publishing an already published opportunity",
      async () => {
        const publishedAt = new Date();

        const opportunity =
          await context.createOpportunity({
            status: "PUBLISHED",
            publishedAt,
          });

        const service =
          new DefaultOpportunityApplicationService();

        await expect(
          service.publish({
            workspaceId: context.workspaceId,
            actorUserId: context.userId,
            opportunityId: opportunity.id,
          }),
        ).rejects.toMatchObject({
          name:
            "OpportunityInvalidStatusTransitionError",
          currentStatus: "PUBLISHED",
          targetStatus: "PUBLISHED",
        });

        const stored =
          await prisma.opportunity.findUnique({
            where: {
              id: opportunity.id,
            },
          });

        expect(stored?.publishedAt?.getTime()).toBe(
          publishedAt.getTime(),
        );
      },
    );

    it(
      "rejects publishing an archived opportunity",
      async () => {
        const opportunity =
          await context.createOpportunity({
            status: "ARCHIVED",
          });

        const service =
          new DefaultOpportunityApplicationService();

        await expect(
          service.publish({
            workspaceId: context.workspaceId,
            actorUserId: context.userId,
            opportunityId: opportunity.id,
          }),
        ).rejects.toMatchObject({
          name:
            "OpportunityInvalidStatusTransitionError",
          currentStatus: "ARCHIVED",
          targetStatus: "PUBLISHED",
        });
      },
    );

    it(
      "rejects publishing without a closing date",
      async () => {
        const opportunity =
          await context.createOpportunity({
            status: "DRAFT",
            closingDate: null,
          });

        const service =
          new DefaultOpportunityApplicationService();

        await expect(
          service.publish({
            workspaceId: context.workspaceId,
            actorUserId: context.userId,
            opportunityId: opportunity.id,
          }),
        ).rejects.toMatchObject({
          name:
            "OpportunityPublishRequirementsError",
          missingFields: ["closingDate"],
        });

        const stored =
          await prisma.opportunity.findUnique({
            where: {
              id: opportunity.id,
            },
          });

        expect(stored?.status).toBe("DRAFT");
        expect(stored?.publishedAt).toBeNull();
      },
    );

    it(
      "rejects publishing when the closing date has expired",
      async () => {
        const opportunity =
          await context.createOpportunity({
            status: "DRAFT",
            closingDate: new Date(
              "2020-01-01T00:00:00.000Z",
            ),
          });

        const service =
          new DefaultOpportunityApplicationService();

        await expect(
          service.publish({
            workspaceId: context.workspaceId,
            actorUserId: context.userId,
            opportunityId: opportunity.id,
          }),
        ).rejects.toMatchObject({
          name:
            "OpportunityPublishRequirementsError",
          missingFields: [
            "closingDate.future",
          ],
        });
      },
    );

    it(
      "rejects publishing when permission is missing",
      async () => {
        const opportunity =
          await context.createOpportunity({
            status: "DRAFT",
          });

        await context.revokePermission(
          Permissions.opportunities.publish,
        );

        const service =
          new DefaultOpportunityApplicationService();

        await expect(
          service.publish({
            workspaceId: context.workspaceId,
            actorUserId: context.userId,
            opportunityId: opportunity.id,
          }),
        ).rejects.toMatchObject({
          name: "PermissionDeniedError",
        });

        await context.grantPermission(
          Permissions.opportunities.publish,
        );

        const stored =
          await prisma.opportunity.findUnique({
            where: {
              id: opportunity.id,
            },
          });

        expect(stored?.status).toBe("DRAFT");
      },
    );

    it(
      "rejects publishing when workspace is read-only",
      async () => {
        const opportunity =
          await context.createOpportunity({
            status: "DRAFT",
          });

        await context.setWorkspaceAccessState(
          "READ_ONLY",
        );

        const service =
          new DefaultOpportunityApplicationService();

        await expect(
          service.publish({
            workspaceId: context.workspaceId,
            actorUserId: context.userId,
            opportunityId: opportunity.id,
          }),
        ).rejects.toMatchObject({
          name:
            "WorkspaceWriteAccessDeniedError",
          reason: "WORKSPACE_READ_ONLY",
        });

        await context.setWorkspaceAccessState(
          "FULL",
        );
      },
    );

    it(
      "does not expose an opportunity from another workspace",
      async () => {
        const opportunity =
          await foreignContext.createOpportunity({
            status: "DRAFT",
          });

        const service =
          new DefaultOpportunityApplicationService();

        await expect(
          service.publish({
            workspaceId: context.workspaceId,
            actorUserId: context.userId,
            opportunityId: opportunity.id,
          }),
        ).rejects.toMatchObject({
          name: "OpportunityNotFoundError",
        });

        const stored =
          await prisma.opportunity.findUnique({
            where: {
              id: opportunity.id,
            },
          });

        expect(stored?.status).toBe("DRAFT");
      },
    );
  },
);
