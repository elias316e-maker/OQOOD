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

import {
  ThrowingOpportunityArchiveAuditRepository,
} from "./fakes/throwing-opportunity-archive-audit.repository";

describe.sequential(
  "Archive Opportunity Audit Rollback",
  () => {
    let context: OpportunityTestContext;

    beforeAll(async () => {
      context =
        await createOpportunityTestContext([
          Permissions.opportunities.delete,
        ]);
    });

    afterAll(async () => {
      await context.cleanup();
      await prisma.$disconnect();
    });

    it(
      "rolls back archiving when audit logging fails",
      async () => {
        const opportunity =
          await context.createOpportunity({
            status: "DRAFT",
          });

        const service =
          new DefaultOpportunityApplicationService(
            new ThrowingOpportunityArchiveAuditRepository(),
          );

        await expect(
          service.archive({
            workspaceId: context.workspaceId,
            actorUserId: context.userId,
            opportunityId: opportunity.id,
          }),
        ).rejects.toThrow(
          "Injected Opportunity Archive Audit Failure",
        );

        const stored =
          await prisma.opportunity.findUnique({
            where: {
              id: opportunity.id,
            },
          });

        expect(stored?.status).toBe("DRAFT");

        const auditCount =
          await prisma.auditLog.count({
            where: {
              workspaceId: context.workspaceId,
              entityId: opportunity.id,
              action: "opportunity.archived",
            },
          });

        expect(auditCount).toBe(0);
      },
    );
  },
);
