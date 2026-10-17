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
  DefaultAwardRecommendationApplicationService,
} from "../services";

import {
  createOpportunityTestContext,
  type OpportunityTestContext,
} from "./builders";

import {
  ThrowingAwardStatusRepository,
} from "./fakes/throwing-award-status.repository";

describe.sequential(
  "Award Recommendation Status Rollback Integration",
  () => {
    let context: OpportunityTestContext;
    let opportunityId: string;
    let offerId: string;

    beforeAll(async () => {
      context =
        await createOpportunityTestContext([
          Permissions.opportunities.award,
        ]);

      const opportunity =
        await context.createOpportunity({
          status: "AWARD_PENDING",
          title: "Award Status Rollback",
        });

      opportunityId = opportunity.id;

      const partner =
        await prisma.businessPartner.create({
          data: {
            workspaceId: context.workspaceId,
            nameAr: "Rollback Supplier",
            nameEn: "Rollback Supplier",
            verificationStatus: "VERIFIED",
          },
          select: { id: true },
        });

      const offer =
        await prisma.offer.create({
          data: {
            opportunityId,
            businessPartnerId: partner.id,
            referenceNumber: "STATUS-001",
            status: "FINANCIALLY_EVALUATED",
            currency: "SAR",
            subtotal: "100000",
            taxAmount: "15000",
            totalAmount: "115000",
            submittedAt: new Date(),
          },
          select: { id: true },
        });

      offerId = offer.id;
    });

    afterAll(async () => {
      await context.cleanup();
      await prisma.$disconnect();
    });

    it(
      "rolls back when opportunity status update fails",
      async () => {
        const service =
          new DefaultAwardRecommendationApplicationService(
            new ThrowingAwardStatusRepository(),
          );

        await expect(
          service.recommend({
            workspaceId: context.workspaceId,
            actorUserId: context.userId,
            opportunityId,
            offerId,
          }),
        ).rejects.toThrow(
          "Injected Award Status Failure",
        );

        const opportunity =
          await prisma.opportunity.findUnique({
            where: {
              id: opportunityId,
            },
            select: {
              status: true,
            },
          });

        expect(opportunity?.status).toBe(
          "AWARD_PENDING",
        );

        const offer =
          await prisma.offer.findUnique({
            where: {
              id: offerId,
            },
            select: {
              status: true,
            },
          });

        expect(offer?.status).toBe(
          "FINANCIALLY_EVALUATED",
        );

        expect(
          await prisma.auditLog.count({
            where: {
              entityId: opportunityId,
              action:
                "opportunity.awarded",
            },
          }),
        ).toBe(0);
      },
    );
  },
);
