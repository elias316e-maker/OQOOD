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

import {
  ThrowingOpportunityPublishAuditRepository,
} from "./fakes/throwing-opportunity-publish-audit.repository";

describe.sequential(
  "Publish Opportunity Audit Rollback",
  () => {
    let context: OpportunityTestContext;

    beforeAll(async () => {
      context =
        await createOpportunityTestContext([
          Permissions.opportunities.publish,
        ]);
    });

    afterAll(async () => {
      await context.cleanup();
      await prisma.$disconnect();
    });

    it(
      "rolls back publishing when audit logging fails",
      async () => {
        const opportunity =
          await context.createOpportunity({
            status: "DRAFT",
          });

        const service =
          new DefaultOpportunityApplicationService(
            new ThrowingOpportunityPublishAuditRepository(),
          );

        await expect(
          service.publish({
            workspaceId: context.workspaceId,
            actorUserId: context.userId,
            opportunityId: opportunity.id,
          }),
        ).rejects.toThrow(
          "Injected Opportunity Publish Audit Failure",
        );

        const stored =
          await prisma.opportunity.findUnique({
            where: {
              id: opportunity.id,
            },
          });

        expect(stored).toMatchObject({
          status: "DRAFT",
          publishedAt: null,
        });

        const auditCount =
          await prisma.auditLog.count({
            where: {
              workspaceId: context.workspaceId,
              entityId: opportunity.id,
              action: "opportunity.published",
            },
          });

        expect(auditCount).toBe(0);
      },
    );
  },
);
