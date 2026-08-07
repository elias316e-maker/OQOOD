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
  DefaultOfferEvaluationApplicationService,
} from "../services";

import {
  createOpportunityTestContext,
  type OpportunityTestContext,
} from "./builders";

import {
  ThrowingOfferEvaluationAuditRepository,
} from "./fakes/throwing-offer-evaluation-audit.repository";

describe.sequential(
  "Offer Evaluation Audit Rollback Integration",
  () => {
    let context: OpportunityTestContext;
    let offerId: string;
    let criterionId: string;

    beforeAll(async () => {
      context =
        await createOpportunityTestContext([
          Permissions.opportunities.evaluate,
        ]);

      const opportunity =
        await context.createOpportunity({
          status: "SUBMISSION_CLOSED",
          title:
            "منافسة اختبار تراجع سجل تقييم العرض",
        });

      const partner =
        await prisma.businessPartner.create({
          data: {
            workspaceId: context.workspaceId,
            nameAr:
              "مورد اختبار تراجع تقييم العرض",
            nameEn:
              "Offer Evaluation Rollback Supplier",
            verificationStatus: "VERIFIED",
          },
          select: {
            id: true,
          },
        });

      const offer =
        await prisma.offer.create({
          data: {
            opportunityId: opportunity.id,
            businessPartnerId: partner.id,
            referenceNumber:
              "OFFER-EVAL-ROLLBACK-001",
            status: "SUBMITTED",
            currency: "SAR",
            subtotal: "50000",
            taxAmount: "7500",
            totalAmount: "57500",
            submittedAt: new Date(),
          },
          select: {
            id: true,
          },
        });

      offerId = offer.id;

      const criterion =
        await prisma.opportunityCriterion.create({
          data: {
            opportunityId: opportunity.id,
            name:
              "معيار اختبار تراجع السجل",
            category: "TECHNICAL",
            scoringMethod: "NUMERIC",
            weight: "100",
            minimumScore: "60",
            required: true,
            active: true,
            displayOrder: 1,
          },
          select: {
            id: true,
          },
        });

      criterionId = criterion.id;
    });

    afterAll(async () => {
      await context.cleanup();
      await prisma.$disconnect();
    });

    it(
      "rolls back the score and offer status when audit creation fails",
      async () => {
        const service =
          new DefaultOfferEvaluationApplicationService(
            new ThrowingOfferEvaluationAuditRepository(),
          );

        await expect(
          service.saveScore({
            workspaceId:
              context.workspaceId,
            actorUserId:
              context.userId,
            offerId,
            criterionId,
            score: "85",
            notes:
              "يجب التراجع عن هذا التقييم.",
          }),
        ).rejects.toThrow(
          "Injected Offer Evaluation Audit Failure",
        );

        const storedScore =
          await prisma.offerCriterionScore.findUnique({
            where: {
              offerId_criterionId: {
                offerId,
                criterionId,
              },
            },
          });

        expect(storedScore).toBeNull();

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
          "SUBMITTED",
        );

        const auditCount =
          await prisma.auditLog.count({
            where: {
              workspaceId:
                context.workspaceId,
              entityId: offerId,
              action:
                "offer.criterion.scored",
            },
          });

        expect(auditCount).toBe(0);
      },
    );
  },
);
