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
  PrismaOfferCriterionScoreRepository,
} from "../repositories";

import {
  createOpportunityTestContext,
  type OpportunityTestContext,
} from "./builders";

import {
  ThrowingOfferEvaluationStatusRepository,
} from "./fakes/throwing-offer-evaluation-status.repository";

describe.sequential(
  "Offer Evaluation Status Rollback Integration",
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
            "منافسة اختبار تراجع تحديث حالة العرض",
        });

      const partner =
        await prisma.businessPartner.create({
          data: {
            workspaceId: context.workspaceId,
            nameAr:
              "مورد اختبار تراجع حالة العرض",
            nameEn:
              "Offer Status Rollback Supplier",
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
              "OFFER-STATUS-ROLLBACK-001",
            status: "SUBMITTED",
            currency: "SAR",
            subtotal: "60000",
            taxAmount: "9000",
            totalAmount: "69000",
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
              "معيار اكتمال التقييم",
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

      const setupService =
        new DefaultOfferEvaluationApplicationService(
          new PrismaOfferCriterionScoreRepository(),
        );

      await setupService.saveScore({
        workspaceId: context.workspaceId,
        actorUserId: context.userId,
        offerId,
        criterionId,
        score: "85",
        notes:
          "تقييم مكتمل قبل اختبار فشل تحديث الحالة.",
      });
    });

    afterAll(async () => {
      await context.cleanup();
      await prisma.$disconnect();
    });

    it(
      "does not complete the evaluation when status update fails",
      async () => {
        const service =
          new DefaultOfferEvaluationApplicationService(
            new ThrowingOfferEvaluationStatusRepository(),
          );

        await expect(
          service.complete({
            workspaceId:
              context.workspaceId,
            actorUserId:
              context.userId,
            offerId,
          }),
        ).rejects.toThrow(
          "Injected Offer Evaluation Status Failure",
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
          "UNDER_REVIEW",
        );

        const completionAuditCount =
          await prisma.auditLog.count({
            where: {
              workspaceId:
                context.workspaceId,
              entityId: offerId,
              action:
                "offer.evaluation.completed",
            },
          });

        expect(completionAuditCount).toBe(0);

        const storedScore =
          await prisma.offerCriterionScore.findUnique({
            where: {
              offerId_criterionId: {
                offerId,
                criterionId,
              },
            },
          });

        expect(storedScore).not.toBeNull();
        expect(storedScore?.score?.toString()).toBe(
          "85",
        );
      },
    );
  },
);
