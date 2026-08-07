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
  DefaultAwardRecommendationApplicationService,
} from "../services";

import {
  createOpportunityTestContext,
  type OpportunityTestContext,
} from "./builders";

describe.sequential(
  "Award Recommendation Integration",
  () => {
    let context: OpportunityTestContext;
    let opportunityId: string;
    let winningOfferId: string;
    let losingOfferId: string;

    beforeAll(async () => {
      context =
        await createOpportunityTestContext([
          Permissions.opportunities.award,
        ]);

      const opportunity =
        await context.createOpportunity({
          status: "AWARD_PENDING",
          title:
            "منافسة اختبار اعتماد الترسية",
        });

      opportunityId = opportunity.id;

      const [winnerPartner, loserPartner] =
        await Promise.all([
          prisma.businessPartner.create({
            data: {
              workspaceId:
                context.workspaceId,
              nameAr:
                "المورد الفائز للاختبار",
              nameEn:
                "Award Winner Supplier",
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
                "المورد غير الفائز للاختبار",
              nameEn:
                "Award Losing Supplier",
              verificationStatus:
                "VERIFIED",
            },
            select: {
              id: true,
            },
          }),
        ]);

      const [winningOffer, losingOffer] =
        await Promise.all([
          prisma.offer.create({
            data: {
              opportunityId,
              businessPartnerId:
                winnerPartner.id,
              referenceNumber:
                "AWARD-WINNER-001",
              status:
                "FINANCIALLY_EVALUATED",
              currency: "SAR",
              subtotal: "100000",
              taxAmount: "15000",
              totalAmount: "115000",
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
                loserPartner.id,
              referenceNumber:
                "AWARD-LOSER-001",
              status:
                "FINANCIALLY_EVALUATED",
              currency: "SAR",
              subtotal: "120000",
              taxAmount: "18000",
              totalAmount: "138000",
              submittedAt: new Date(),
            },
            select: {
              id: true,
            },
          }),
        ]);

      winningOfferId = winningOffer.id;
      losingOfferId = losingOffer.id;
    });

    afterAll(async () => {
      await context.cleanup();
      await prisma.$disconnect();
    });

    it(
      "awards the selected offer, marks competing offers lost, and closes the opportunity",
      async () => {
        const service =
          new DefaultAwardRecommendationApplicationService();

        const result =
          await service.recommend({
            workspaceId:
              context.workspaceId,
            actorUserId:
              context.userId,
            opportunityId,
            offerId:
              winningOfferId,
            justification:
              "أفضل عرض مالي ومستوفٍ لجميع المتطلبات.",
          });

        expect(result.opportunity).toMatchObject({
          id: opportunityId,
          status: "AWARDED",
        });

        expect(result.awardedOffer).toMatchObject({
          offerId: winningOfferId,
          totalAmount: "115000",
          currency: "SAR",
        });

        expect(
          result.summary.awardedAt,
        ).toBeTruthy();

        expect(
          result.summary.recommendedBy,
        ).toBe(context.userId);

        const storedOpportunity =
          await prisma.opportunity.findUnique({
            where: {
              id: opportunityId,
            },
            select: {
              status: true,
              closedAt: true,
            },
          });

        expect(
          storedOpportunity?.status,
        ).toBe("AWARDED");

        expect(
          storedOpportunity?.closedAt,
        ).not.toBeNull();

        const storedOffers =
          await prisma.offer.findMany({
            where: {
              id: {
                in: [
                  winningOfferId,
                  losingOfferId,
                ],
              },
            },
            select: {
              id: true,
              status: true,
            },
          });

        const storedWinner =
          storedOffers.find(
            (offer) =>
              offer.id ===
              winningOfferId,
          );

        const storedLoser =
          storedOffers.find(
            (offer) =>
              offer.id ===
              losingOfferId,
          );

        expect(storedWinner?.status).toBe(
          "WINNER",
        );

        expect(storedLoser?.status).toBe(
          "LOST",
        );

        const audit =
          await prisma.auditLog.findFirst({
            where: {
              workspaceId:
                context.workspaceId,
              entityId:
                opportunityId,
              action:
                "opportunity.awarded",
            },
          });

        expect(audit).not.toBeNull();

        expect(
          audit?.metadata,
        ).toMatchObject({
          opportunityId,
          offerId:
            winningOfferId,
          justification:
            "أفضل عرض مالي ومستوفٍ لجميع المتطلبات.",
          previousOpportunityStatus:
            "AWARD_PENDING",
          targetOpportunityStatus:
            "AWARDED",
          previousOfferStatus:
            "FINANCIALLY_EVALUATED",
          targetOfferStatus:
            "WINNER",
        });
      },
    );

    it(
      "rejects awarding when the opportunity is not pending award",
      async () => {
        const opportunity =
          await context.createOpportunity({
            status: "FINANCIAL_EVALUATION",
            title:
              "رفض الترسية قبل إنشاء التوصية",
          });

        const partner =
          await prisma.businessPartner.create({
            data: {
              workspaceId:
                context.workspaceId,
              nameAr:
                "مورد اختبار",
              nameEn:
                "Test Supplier",
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
              opportunityId:
                opportunity.id,
              businessPartnerId:
                partner.id,
              referenceNumber:
                "NEG-001",
              status:
                "FINANCIALLY_EVALUATED",
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

        const service =
          new DefaultAwardRecommendationApplicationService();

        await expect(
          service.recommend({
            workspaceId:
              context.workspaceId,
            actorUserId:
              context.userId,
            opportunityId:
              opportunity.id,
            offerId:
              offer.id,
          }),
        ).rejects.toThrow(
          "يجب إنشاء توصية الترسية قبل اعتماد العرض الفائز.",
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
        ).toBe(
          "FINANCIAL_EVALUATION",
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

        expect(
          storedOffer?.status,
        ).toBe(
          "FINANCIALLY_EVALUATED",
        );

        expect(
          await prisma.auditLog.count({
            where: {
              workspaceId:
                context.workspaceId,
              entityId:
                opportunity.id,
              action:
                "opportunity.awarded",
            },
          }),
        ).toBe(0);
      },
    );

    it(
      "rejects awarding when the selected offer is not financially evaluated",
      async () => {
        const opportunity =
          await context.createOpportunity({
            status: "AWARD_PENDING",
            title:
              "رفض ترسية عرض غير مؤهل",
          });

        const partner =
          await prisma.businessPartner.create({
            data: {
              workspaceId:
                context.workspaceId,
              nameAr:
                "مورد اختبار",
              nameEn:
                "Test Supplier",
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
              opportunityId:
                opportunity.id,
              businessPartnerId:
                partner.id,
              referenceNumber:
                "NEG-002",
              status:
                "TECHNICALLY_ACCEPTED",
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

        const service =
          new DefaultAwardRecommendationApplicationService();

        await expect(
          service.recommend({
            workspaceId:
              context.workspaceId,
            actorUserId:
              context.userId,
            opportunityId:
              opportunity.id,
            offerId:
              offer.id,
          }),
        ).rejects.toThrow(
          "العرض المحدد غير مؤهل للترسية.",
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
        ).toBe(
          "AWARD_PENDING",
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

        expect(
          storedOffer?.status,
        ).toBe(
          "TECHNICALLY_ACCEPTED",
        );

        expect(
          await prisma.auditLog.count({
            where: {
              workspaceId:
                context.workspaceId,
              entityId:
                opportunity.id,
              action:
                "opportunity.awarded",
            },
          }),
        ).toBe(0);
      },
    );

  },
);
