import "dotenv/config";

import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import {
  Permissions,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

import {
  createOpportunityTestContext,
  type OpportunityTestContext,
} from "./builders";

describe.sequential(
  "Opportunity Test Context",
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
      "creates an isolated workspace with billing and membership",
      async () => {
        const workspace =
          await prisma.workspace.findUnique({
            where: {
              id: context.workspaceId,
            },
            include: {
              subscription: true,
              members: true,
            },
          });

        expect(workspace).not.toBeNull();
        expect(workspace?.subscription).not.toBeNull();
        expect(
          workspace?.members.some(
            (member) =>
              member.userId === context.userId,
          ),
        ).toBe(true);
      },
    );

    it(
      "creates an opportunity with safe defaults",
      async () => {
        const opportunity =
          await context.createOpportunity();

        expect(opportunity).toMatchObject({
          workspaceId: context.workspaceId,
          createdById: context.userId,
          type: "RFQ",
          status: "DRAFT",
          visibility: "INVITED",
          priority: "NORMAL",
          currency: "SAR",
        });

        expect(opportunity.closingDate).toBeInstanceOf(
          Date,
        );
      },
    );

    it(
      "grants and revokes permissions",
      async () => {
        await context.grantPermission(
          Permissions.opportunities.update,
        );

        const granted =
          await prisma.rolePermission.count({
            where: {
              roleId: context.roleId,
              permission: {
                code:
                  Permissions.opportunities.update,
              },
            },
          });

        expect(granted).toBe(1);

        await context.revokePermission(
          Permissions.opportunities.update,
        );

        const revoked =
          await prisma.rolePermission.count({
            where: {
              roleId: context.roleId,
              permission: {
                code:
                  Permissions.opportunities.update,
              },
            },
          });

        expect(revoked).toBe(0);
      },
    );

    it(
      "changes workspace access state",
      async () => {
        await context.setWorkspaceAccessState(
          "READ_ONLY",
        );

        const subscription =
          await prisma.subscription.findUnique({
            where: {
              workspaceId: context.workspaceId,
            },
          });

        expect(subscription?.accessState).toBe(
          "READ_ONLY",
        );

        await context.setWorkspaceAccessState(
          "FULL",
        );
      },
    );
  },
);
