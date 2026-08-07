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

describe.sequential(
  "Financial Evaluation Integration",
  () => {
    let context: OpportunityTestContext;
    let opportunityId: string;
    let lowestOfferId: string;
    let higherOfferId: string;

    beforeAll(async () => {
      context =
        await createOpportunityTestContext([
          Permissions.opportunities.read,
          Permissions.opportunities.evaluate,
          Permissions.opportunities.award,
        ]);

      const opportunity =
        await context.createOpportunity({
          status: "TECHNICAL_EVALUATION",
          title:
            "منافسة اختبار التقييم المالي",
        });

      opportunityId = opportunity.id;

      const partners =
        await Promise.all([
          prisma.businessPartner.create({
            data: {
              workspaceId:
                context.workspaceId,
              nameAr:
                "المورد المالي الأول",
              nameEn:
                "Financial Supplier One",
              verificationStatus:
                "VERIFIED",
            },
            select: {
              id: true,
            },
          }),
          prisma.businessPartner.create({
            data: {
              workspaceId:
                context.workspaceId,
              nameAr:
                "المورد المالي الثاني",
              nameEn:
                "Financial Supplier Two",
              verificationStatus:
                "VERIFIED",
            },
            select: {
              id: true,
            },
          }),
        ]);

      const offers = await Promise.all([
        prisma.offer.create({
          data: {
            opportunityId,
            businessPartnerId:
              partners[0].id,
            referenceNumber:
              "FIN-EVAL-LOWEST",
            status:
              "TECHNICALLY_ACCEPTED",
            currency: "SAR",
            subtotal: "100000",
            taxAmount: "15000",
            totalAmount: "115000",
            deliveryDays: 30,
            validityDays: 90,
            submittedAt: new Date(),
          },
          select: {
            id: true,
          },
        }),
        prisma.offer.create({
          data: {
            opportunityId,
            businessPartnerId:
              partners[1].id,
            referenceNumber:
              "FIN-EVAL-HIGHER",
            status:
              "TECHNICALLY_ACCEPTED",
            currency: "SAR",
            subtotal: "120000",
            taxAmount: "18000",
            totalAmount: "138000",
            deliveryDays: 25,
            validityDays: 90,
            submittedAt: new Date(),
          },
          select: {
            id: true,
          },
        }),
      ]);

      lowestOfferId = offers[0].id;
      higherOfferId = offers[1].id;
    });

    afterAll(async () => {
      await context.cleanup();
      await prisma.$disconnect();
    });

    it(
      "ranks offers, completes the financial evaluation, and recommends the lowest offer",
      async () => {
        const service =
          new DefaultFinancialEvaluationApplicationService();

        const initial =
          await service.get({
            workspaceId:
              context.workspaceId,
            actorUserId:
              context.userId,
            opportunityId,
          });

        expect(initial.offers).toHaveLength(2);

        expect(initial.offers[0]).toMatchObject({
          offerId: lowestOfferId,
          rank: 1,
          recommended: true,
          priceVariancePercentage:
            "0.00",
        });

        expect(initial.offers[1]).toMatchObject({
          offerId: higherOfferId,
          rank: 2,
          recommended: false,
          priceVariancePercentage:
            "20.00",
        });

        expect(initial.summary).toMatchObject({
          eligibleOffersCount: 2,
          evaluatedOffersCount: 0,
          lowestOfferId,
          recommendedOfferId:
            lowestOfferId,
        });

        const completed =
          await service.complete({
            workspaceId:
              context.workspaceId,
            actorUserId:
              context.userId,
            opportunityId,
          });

        expect(
          completed.opportunity.status,
        ).toBe("FINANCIAL_EVALUATION");

        expect(
          completed.summary.evaluatedOffersCount,
        ).toBe(2);

        expect(
          completed.offers.every(
            (offer) =>
              offer.status ===
              "FINANCIALLY_EVALUATED",
          ),
        ).toBe(true);

        const storedOffers =
          await prisma.offer.findMany({
            where: {
              id: {
                in: [
                  lowestOfferId,
                  higherOfferId,
                ],
              },
            },
            select: {
              id: true,
              status: true,
            },
          });

        expect(
          storedOffers.every(
            (offer) =>
              offer.status ===
              "FINANCIALLY_EVALUATED",
          ),
        ).toBe(true);

        const recommendation =
          await service.recommendAward({
            workspaceId:
              context.workspaceId,
            actorUserId:
              context.userId,
            opportunityId,
          });

        expect(
          recommendation.opportunity.status,
        ).toBe("AWARD_PENDING");

        expect(
          recommendation.summary
            .recommendedOfferId,
        ).toBe(lowestOfferId);

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
        ).toBe("AWARD_PENDING");

        const completionAudit =
          await prisma.auditLog.findFirst({
            where: {
              workspaceId:
                context.workspaceId,
              entityId: opportunityId,
              action:
                "opportunity.financial_evaluation.completed",
            },
          });

        expect(completionAudit).not.toBeNull();

        const recommendationAudit =
          await prisma.auditLog.findFirst({
            where: {
              workspaceId:
                context.workspaceId,
              entityId: opportunityId,
              action:
                "opportunity.award.recommended",
            },
          });

        expect(recommendationAudit).not.toBeNull();

        expect(
          recommendationAudit?.metadata,
        ).toMatchObject({
          recommendedOfferId:
            lowestOfferId,
          lowestOfferId,
          eligibleOffersCount: 2,
        });
      },
    );

    it(
      "rejects completion when no financially eligible offers exist",
      async () => {
        const opportunity =
          await context.createOpportunity({
            status: "TECHNICAL_EVALUATION",
            title:
              "منافسة بدون عروض مؤهلة ماليًا",
          });

        const partner =
          await prisma.businessPartner.create({
            data: {
              workspaceId:
                context.workspaceId,
              nameAr:
                "مورد غير مؤهل ماليًا",
              nameEn:
                "Financially Ineligible Supplier",
              verificationStatus:
                "VERIFIED",
            },
            select: {
              id: true,
            },
          });

        await prisma.offer.create({
          data: {
            opportunityId:
              opportunity.id,
            businessPartnerId:
              partner.id,
            referenceNumber:
              "FIN-NOT-ELIGIBLE",
            status:
              "TECHNICALLY_REJECTED",
            currency: "SAR",
            subtotal: "90000",
            taxAmount: "13500",
            totalAmount: "103500",
            submittedAt: new Date(),
          },
        });

        const service =
          new DefaultFinancialEvaluationApplicationService();

        await expect(
          service.complete({
            workspaceId:
              context.workspaceId,
            actorUserId:
              context.userId,
            opportunityId:
              opportunity.id,
          }),
        ).rejects.toThrow(
          "لا توجد عروض مقبولة فنيًا لإجراء التقييم المالي.",
        );

        const storedOpportunity =
          await prisma.opportunity.findUnique({
            where: {
              id: opportunity.id,
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
                opportunity.id,
              action:
                "opportunity.financial_evaluation.completed",
            },
          });

        expect(auditCount).toBe(0);
      },
    );

  },
);
