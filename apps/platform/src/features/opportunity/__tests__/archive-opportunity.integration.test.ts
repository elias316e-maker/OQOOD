import "dotenv/config";

import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import { Permissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

import {
  DefaultOpportunityApplicationService,
} from "../services";

import {
  createOpportunityTestContext,
  type OpportunityTestContext,
} from "./builders";

describe.sequential(
  "Archive Opportunity Integration",
  () => {
    let context: OpportunityTestContext;
    let foreignContext: OpportunityTestContext;

    beforeAll(async () => {
      context =
        await createOpportunityTestContext([
          Permissions.opportunities.delete,
        ]);

      foreignContext =
        await createOpportunityTestContext([
          Permissions.opportunities.delete,
        ]);
    });

    afterAll(async () => {
      await foreignContext.cleanup();
      await context.cleanup();
      await prisma.$disconnect();
    });

    it(
      "archives a draft opportunity and creates an audit log",
      async () => {
        const opportunity =
          await context.createOpportunity({
            status: "DRAFT",
          });

        const service =
          new DefaultOpportunityApplicationService();

        const result = await service.archive({
          workspaceId: context.workspaceId,
          actorUserId: context.userId,
          opportunityId: opportunity.id,
        });

        expect(result).toMatchObject({
          id: opportunity.id,
          workspaceId: context.workspaceId,
          status: "ARCHIVED",
        });

        const stored =
          await prisma.opportunity.findUnique({
            where: {
              id: opportunity.id,
            },
          });

        expect(stored?.status).toBe("ARCHIVED");

        const audit =
          await prisma.auditLog.findFirst({
            where: {
              workspaceId: context.workspaceId,
              entityType: "Opportunity",
              entityId: opportunity.id,
              action: "opportunity.archived",
            },
          });

        expect(audit).not.toBeNull();
        expect(audit?.userId).toBe(
          context.userId,
        );

        expect(audit?.metadata).toMatchObject({
          number: opportunity.number,
          previousStatus: "DRAFT",
          targetStatus: "ARCHIVED",
        });
      },
    );

    it(
      "archives a published opportunity",
      async () => {
        const opportunity =
          await context.createOpportunity({
            status: "PUBLISHED",
            publishedAt: new Date(),
          });

        const service =
          new DefaultOpportunityApplicationService();

        const result = await service.archive({
          workspaceId: context.workspaceId,
          actorUserId: context.userId,
          opportunityId: opportunity.id,
        });

        expect(result.status).toBe("ARCHIVED");

        const audit =
          await prisma.auditLog.findFirst({
            where: {
              workspaceId: context.workspaceId,
              entityId: opportunity.id,
              action: "opportunity.archived",
            },
          });

        expect(audit?.metadata).toMatchObject({
          previousStatus: "PUBLISHED",
          targetStatus: "ARCHIVED",
        });
      },
    );

    it(
      "rejects archiving an already archived opportunity",
      async () => {
        const opportunity =
          await context.createOpportunity({
            status: "ARCHIVED",
          });

        const service =
          new DefaultOpportunityApplicationService();

        await expect(
          service.archive({
            workspaceId: context.workspaceId,
            actorUserId: context.userId,
            opportunityId: opportunity.id,
          }),
        ).rejects.toMatchObject({
          name:
            "OpportunityInvalidStatusTransitionError",
          currentStatus: "ARCHIVED",
          targetStatus: "ARCHIVED",
        });
      },
    );

    it(
      "rejects archiving when permission is missing",
      async () => {
        const opportunity =
          await context.createOpportunity({
            status: "DRAFT",
          });

        await context.revokePermission(
          Permissions.opportunities.delete,
        );

        const service =
          new DefaultOpportunityApplicationService();

        await expect(
          service.archive({
            workspaceId: context.workspaceId,
            actorUserId: context.userId,
            opportunityId: opportunity.id,
          }),
        ).rejects.toMatchObject({
          name: "PermissionDeniedError",
        });

        await context.grantPermission(
          Permissions.opportunities.delete,
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
      "rejects archiving when workspace is read-only",
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
          service.archive({
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
      "does not expose an opportunity from another workspace",
      async () => {
        const opportunity =
          await foreignContext.createOpportunity({
            status: "DRAFT",
          });

        const service =
          new DefaultOpportunityApplicationService();

        await expect(
          service.archive({
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
