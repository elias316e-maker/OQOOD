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
  ThrowingOfferEvaluationUpsertRepository,
} from "./fakes/throwing-offer-evaluation-upsert.repository";

describe.sequential(
  "Offer Evaluation Upsert Rollback Integration",
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
            "منافسة اختبار فشل حفظ درجة العرض",
        });

      const partner =
        await prisma.businessPartner.create({
          data: {
            workspaceId: context.workspaceId,
            nameAr:
              "مورد اختبار فشل حفظ الدرجة",
            nameEn:
              "Offer Upsert Rollback Supplier",
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
              "OFFER-UPSERT-ROLLBACK-001",
            status: "SUBMITTED",
            currency: "SAR",
            subtotal: "45000",
            taxAmount: "6750",
            totalAmount: "51750",
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
              "معيار فشل حفظ الدرجة",
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
      "does not change the offer or create audit data when score upsert fails",
      async () => {
        const service =
          new DefaultOfferEvaluationApplicationService(
            new ThrowingOfferEvaluationUpsertRepository(),
          );

        await expect(
          service.saveScore({
            workspaceId:
              context.workspaceId,
            actorUserId:
              context.userId,
            offerId,
            criterionId,
            score: "90",
            notes:
              "يجب ألا يتم حفظ هذه الدرجة.",
          }),
        ).rejects.toThrow(
          "Injected Offer Evaluation Upsert Failure",
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
