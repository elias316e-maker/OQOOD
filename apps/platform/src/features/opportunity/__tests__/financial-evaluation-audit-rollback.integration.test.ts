import "dotenv/config";

import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import {
  prisma,
} from "@/lib/prisma";

import {
  Permissions,
} from "@/lib/permissions";

import {
  DefaultFinancialEvaluationApplicationService,
} from "../services";

import {
  createOpportunityTestContext,
  type OpportunityTestContext,
} from "./builders";

import {
  ThrowingFinancialEvaluationAuditRepository,
} from "./fakes/throwing-financial-evaluation-audit.repository";

describe.sequential(
  "Financial Evaluation Audit Rollback Integration",
  () => {
    let context: OpportunityTestContext;
    let opportunityId: string;
    let offerId: string;

    beforeAll(async () => {
      context =
        await createOpportunityTestContext([
          Permissions.opportunities.evaluate,
        ]);

      const opportunity =
        await context.createOpportunity({
          status: "TECHNICAL_EVALUATION",
          title:
            "منافسة اختبار تراجع التقييم المالي",
        });

      opportunityId = opportunity.id;

      const partner =
        await prisma.businessPartner.create({
          data: {
            workspaceId:
              context.workspaceId,
            nameAr:
              "مورد تراجع التقييم المالي",
            nameEn:
              "Financial Rollback Supplier",
            verificationStatus:
              "VERIFIED",
          },
          select: {
            id: true,
          },
        });

      const offer =
        await prisma.offer.create({
          data: {
            opportunityId,
            businessPartnerId:
              partner.id,
            referenceNumber:
              "FIN-ROLLBACK-001",
            status:
              "TECHNICALLY_ACCEPTED",
            currency: "SAR",
            subtotal: "70000",
            taxAmount: "10500",
            totalAmount: "80500",
            submittedAt: new Date(),
          },
          select: {
            id: true,
          },
        });

      offerId = offer.id;
    });

    afterAll(async () => {
      await context.cleanup();
      await prisma.$disconnect();
    });

    it(
      "rolls back offer and opportunity status when audit creation fails",
      async () => {
        const service =
          new DefaultFinancialEvaluationApplicationService(
            new ThrowingFinancialEvaluationAuditRepository(),
          );

        await expect(
          service.complete({
            workspaceId:
              context.workspaceId,
            actorUserId:
              context.userId,
            opportunityId,
          }),
        ).rejects.toThrow(
          "Injected Financial Evaluation Audit Failure",
        );

        const storedOffer =
          await prisma.offer.findUnique({
            where: {
              id: offerId,
            },
            select: {
              status: true,
            },
          });

        expect(storedOffer?.status).toBe(
          "TECHNICALLY_ACCEPTED",
        );

        const storedOpportunity =
          await prisma.opportunity.findUnique({
            where: {
              id: opportunityId,
            },
            select: {
              status: true,
            },
          });

        expect(
          storedOpportunity?.status,
        ).toBe("TECHNICAL_EVALUATION");

        const auditCount =
          await prisma.auditLog.count({
            where: {
              workspaceId:
                context.workspaceId,
              entityId:
                opportunityId,
              action:
                "opportunity.financial_evaluation.completed",
            },
          });

        expect(auditCount).toBe(0);
      },
    );
  },
);
