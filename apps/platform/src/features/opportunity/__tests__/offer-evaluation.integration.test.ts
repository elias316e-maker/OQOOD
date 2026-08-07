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

describe.sequential(
  "Offer Evaluation Integration",
  () => {
    let context: OpportunityTestContext;
    let offerId: string;
    let numericCriterionId: string;
    let passFailCriterionId: string;

    beforeAll(async () => {
      context =
        await createOpportunityTestContext([
          Permissions.opportunities.evaluate,
        ]);

      const opportunity =
        await context.createOpportunity({
          status: "SUBMISSION_CLOSED",
          title: "منافسة اختبار تقييم العروض",
        });

      const partner =
        await prisma.businessPartner.create({
          data: {
            workspaceId: context.workspaceId,
            nameAr: "مورد اختبار التقييم",
            nameEn: "Evaluation Test Supplier",
            city: "الدمام",
            verificationStatus: "VERIFIED",
          },
          select: {
            id: true,
          },
        });

      const offer = await prisma.offer.create({
        data: {
          opportunityId: opportunity.id,
          businessPartnerId: partner.id,
          referenceNumber: "OFFER-EVAL-001",
          status: "SUBMITTED",
          currency: "SAR",
          subtotal: "100000",
          taxAmount: "15000",
          totalAmount: "115000",
          submittedAt: new Date(),
        },
        select: {
          id: true,
        },
      });

      offerId = offer.id;

      const numericCriterion =
        await prisma.opportunityCriterion.create({
          data: {
            opportunityId: opportunity.id,
            name: "التقييم الفني",
            description:
              "درجة التقييم الفني للعرض",
            category: "TECHNICAL",
            scoringMethod: "NUMERIC",
            weight: "70",
            minimumScore: "60",
            required: true,
            active: true,
            displayOrder: 1,
          },
          select: {
            id: true,
          },
        });

      numericCriterionId =
        numericCriterion.id;

      const passFailCriterion =
        await prisma.opportunityCriterion.create({
          data: {
            opportunityId: opportunity.id,
            name: "استيفاء المستندات",
            description:
              "التحقق من اكتمال المستندات المطلوبة",
            category: "DOCUMENT",
            scoringMethod: "PASS_FAIL",
            weight: "30",
            minimumScore: null,
            required: true,
            active: true,
            displayOrder: 2,
          },
          select: {
            id: true,
          },
        });

      passFailCriterionId =
        passFailCriterion.id;
    });

    afterAll(async () => {
      await context.cleanup();
      await prisma.$disconnect();
    });

    it(
      "evaluates all criteria and technically accepts the offer",
      async () => {
        const service =
          new DefaultOfferEvaluationApplicationService();

        const numericResult =
          await service.saveScore({
            workspaceId:
              context.workspaceId,
            actorUserId:
              context.userId,
            offerId,
            criterionId:
              numericCriterionId,
            score: "85",
            notes:
              "العرض مستوفٍ للمتطلبات الفنية.",
          });

        expect(
          numericResult.offer.status,
        ).toBe("UNDER_REVIEW");

        expect(
          numericResult.summary.completedCriteriaCount,
        ).toBe(1);

        expect(
          numericResult.summary.complete,
        ).toBe(false);

        const passFailResult =
          await service.saveScore({
            workspaceId:
              context.workspaceId,
            actorUserId:
              context.userId,
            offerId,
            criterionId:
              passFailCriterionId,
            passed: true,
            notes:
              "جميع المستندات مكتملة.",
          });

        expect(
          passFailResult.summary,
        ).toMatchObject({
          completedCriteriaCount: 2,
          totalCriteriaCount: 2,
          requiredCriteriaCount: 2,
          passedRequiredCriteriaCount: 2,
          failedRequiredCriteriaCount: 0,
          complete: true,
          passed: true,
        });

        expect(
          Number(
            passFailResult.summary
              .totalWeightedScore,
          ),
        ).toBeCloseTo(89.5);

        const storedScores =
          await prisma.offerCriterionScore.findMany({
            where: {
              offerId,
            },
          });

        expect(storedScores).toHaveLength(2);

        const completed =
          await service.complete({
            workspaceId:
              context.workspaceId,
            actorUserId:
              context.userId,
            offerId,
          });

        expect(completed.offer.status).toBe(
          "TECHNICALLY_ACCEPTED",
        );

        expect(completed.summary.passed).toBe(
          true,
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

        const scoreAudits =
          await prisma.auditLog.count({
            where: {
              workspaceId:
                context.workspaceId,
              entityId: offerId,
              action:
                "offer.criterion.scored",
            },
          });

        expect(scoreAudits).toBe(2);

        const completionAudit =
          await prisma.auditLog.findFirst({
            where: {
              workspaceId:
                context.workspaceId,
              entityId: offerId,
              action:
                "offer.evaluation.completed",
            },
          });

        expect(completionAudit).not.toBeNull();

        expect(
          completionAudit?.metadata,
        ).toMatchObject({
          offerId,
          targetStatus:
            "TECHNICALLY_ACCEPTED",
          failedRequiredCriteriaCount: 0,
          passed: true,
        });
      },
    );

    it(
      "technically rejects the offer when a required criterion fails",
      async () => {
        const opportunity =
          await context.createOpportunity({
            status: "SUBMISSION_CLOSED",
            title: "منافسة اختبار رفض العرض",
          });

        const partner =
          await prisma.businessPartner.create({
            data: {
              workspaceId: context.workspaceId,
              nameAr: "مورد اختبار الرفض",
              nameEn: "Rejected Evaluation Supplier",
              city: "الرياض",
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
                "OFFER-EVAL-REJECT-001",
              status: "SUBMITTED",
              currency: "SAR",
              subtotal: "80000",
              taxAmount: "12000",
              totalAmount: "92000",
              submittedAt: new Date(),
            },
            select: {
              id: true,
            },
          });

        const criterion =
          await prisma.opportunityCriterion.create({
            data: {
              opportunityId: opportunity.id,
              name: "الامتثال الإلزامي",
              description:
                "معيار إلزامي للامتثال",
              category: "COMPLIANCE",
              scoringMethod: "PASS_FAIL",
              weight: "100",
              minimumScore: null,
              required: true,
              active: true,
              displayOrder: 1,
            },
            select: {
              id: true,
            },
          });

        const service =
          new DefaultOfferEvaluationApplicationService();

        const evaluated =
          await service.saveScore({
            workspaceId:
              context.workspaceId,
            actorUserId:
              context.userId,
            offerId: offer.id,
            criterionId: criterion.id,
            passed: false,
            notes:
              "لم يستوفِ العرض متطلبات الامتثال.",
          });

        expect(evaluated.summary).toMatchObject({
          complete: true,
          passed: false,
          requiredCriteriaCount: 1,
          passedRequiredCriteriaCount: 0,
          failedRequiredCriteriaCount: 1,
        });

        const completed =
          await service.complete({
            workspaceId:
              context.workspaceId,
            actorUserId:
              context.userId,
            offerId: offer.id,
          });

        expect(completed.offer.status).toBe(
          "TECHNICALLY_REJECTED",
        );

        expect(completed.summary.passed).toBe(
          false,
        );

        const storedOffer =
          await prisma.offer.findUnique({
            where: {
              id: offer.id,
            },
            select: {
              status: true,
            },
          });

        expect(storedOffer?.status).toBe(
          "TECHNICALLY_REJECTED",
        );

        const completionAudit =
          await prisma.auditLog.findFirst({
            where: {
              workspaceId:
                context.workspaceId,
              entityId: offer.id,
              action:
                "offer.evaluation.completed",
            },
          });

        expect(
          completionAudit?.metadata,
        ).toMatchObject({
          offerId: offer.id,
          targetStatus:
            "TECHNICALLY_REJECTED",
          failedRequiredCriteriaCount: 1,
          passed: false,
        });
      },
    );

  },
);
