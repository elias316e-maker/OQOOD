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

import {
  prisma,
} from "@/lib/prisma";

import {
  createOpportunityTestContext,
  type OpportunityTestContext,
} from "@/features/opportunity/__tests__/builders";

import {
  DefaultAwardNotificationApplicationService,
} from "../services";

describe.sequential(
  "Award Notification Integration",
  () => {
    let context: OpportunityTestContext;
    let opportunityId: string;
    let winnerPartnerId: string;
    let loserPartnerId: string;
    let skippedPartnerId: string;

    beforeAll(async () => {
      context =
        await createOpportunityTestContext([
          Permissions.opportunities.read,
        ]);

      const opportunity =
        await context.createOpportunity({
          status: "AWARDED",
          title:
            "منافسة اختبار إشعارات الترسية",
        });

      opportunityId = opportunity.id;

      const [
        winnerPartner,
        loserPartner,
        skippedPartner,
      ] = await Promise.all([
        prisma.businessPartner.create({
          data: {
            workspaceId:
              context.workspaceId,
            nameAr:
              "المورد الفائز للإشعارات",
            nameEn:
              "Award Notification Winner",
            email:
              "winner@example.com",
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
              "المورد غير الفائز للإشعارات",
            nameEn:
              "Award Notification Loser",
            email:
              "loser@example.com",
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
              "مورد بلا بريد",
            nameEn:
              "Supplier Without Email",
            email: null,
            verificationStatus:
              "VERIFIED",
          },
          select: {
            id: true,
          },
        }),
      ]);

      winnerPartnerId =
        winnerPartner.id;

      loserPartnerId =
        loserPartner.id;

      skippedPartnerId =
        skippedPartner.id;

      await Promise.all([
        prisma.offer.create({
          data: {
            opportunityId,
            businessPartnerId:
              winnerPartner.id,
            referenceNumber:
              "NOTIFY-WINNER-001",
            status: "WINNER",
            currency: "SAR",
            subtotal: "100000",
            taxAmount: "15000",
            totalAmount: "115000",
            submittedAt: new Date(),
          },
        }),
        prisma.offer.create({
          data: {
            opportunityId,
            businessPartnerId:
              loserPartner.id,
            referenceNumber:
              "NOTIFY-LOSER-001",
            status: "LOST",
            currency: "SAR",
            subtotal: "120000",
            taxAmount: "18000",
            totalAmount: "138000",
            submittedAt: new Date(),
          },
        }),
        prisma.offer.create({
          data: {
            opportunityId,
            businessPartnerId:
              skippedPartner.id,
            referenceNumber:
              "NOTIFY-SKIPPED-001",
            status: "LOST",
            currency: "SAR",
            subtotal: "125000",
            taxAmount: "18750",
            totalAmount: "143750",
            submittedAt: new Date(),
          },
        }),
      ]);
    });

    afterAll(async () => {
      await context.cleanup();
      await prisma.$disconnect();
    });

    it(
      "queues winner and loser email notifications and skips a supplier without email",
      async () => {
        const service =
          new DefaultAwardNotificationApplicationService();

        const result =
          await service.queueForOpportunity({
            workspaceId:
              context.workspaceId,
            actorUserId:
              context.userId,
            opportunityId,
          });

        expect(
          result.opportunityId,
        ).toBe(opportunityId);

        expect(
          result.queuedCount,
        ).toBe(2);

        expect(
          result.skippedCount,
        ).toBe(1);

        expect(
          result.deliveries,
        ).toHaveLength(2);

        expect(
          result.deliveries,
        ).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              businessPartnerId:
                winnerPartnerId,
              recipient:
                "winner@example.com",
              outcome:
                "WINNER",
              created:
                true,
            }),
            expect.objectContaining({
              businessPartnerId:
                loserPartnerId,
              recipient:
                "loser@example.com",
              outcome:
                "LOST",
              created:
                true,
            }),
          ]),
        );

        const deliveries =
          await prisma.notificationDelivery.findMany({
            where: {
              workspaceId:
                context.workspaceId,
              category:
                "OPPORTUNITY_AWARD_RESULT",
            },
            orderBy: {
              recipient: "asc",
            },
          });

        expect(deliveries).toHaveLength(2);

        const winnerDelivery =
          deliveries.find(
            (delivery) =>
              delivery.recipient ===
              "winner@example.com",
          );

        const loserDelivery =
          deliveries.find(
            (delivery) =>
              delivery.recipient ===
              "loser@example.com",
          );

        expect(winnerDelivery).toMatchObject({
          channel: "EMAIL",
          status: "PENDING",
          attempts: 0,
          recipient:
            "winner@example.com",
          href:
            `/platform/opportunities/${opportunityId}/award`,
        });

        expect(
          winnerDelivery?.subject,
        ).toContain(
          "إشعار ترسية المنافسة",
        );

        expect(
          winnerDelivery?.body,
        ).toContain(
          "تمت ترسية المنافسة",
        );

        expect(loserDelivery).toMatchObject({
          channel: "EMAIL",
          status: "PENDING",
          attempts: 0,
          recipient:
            "loser@example.com",
          href:
            `/platform/opportunities/${opportunityId}/award`,
        });

        expect(
          loserDelivery?.subject,
        ).toContain(
          "إشعار نتيجة المنافسة",
        );

        expect(
          loserDelivery?.body,
        ).toContain(
          "لم تتم ترسية المنافسة على عرضكم",
        );

        const skippedDeliveryCount =
          await prisma.notificationDelivery.count({
            where: {
              workspaceId:
                context.workspaceId,
              body: {
                contains:
                  skippedPartnerId,
              },
            },
          });

        expect(
          skippedDeliveryCount,
        ).toBe(0);
      },
    );

    it(
      "returns existing award deliveries without creating duplicates",
      async () => {
        const service =
          new DefaultAwardNotificationApplicationService();

        const first =
          await service.queueForOpportunity({
            workspaceId:
              context.workspaceId,
            actorUserId:
              context.userId,
            opportunityId,
          });

        const second =
          await service.queueForOpportunity({
            workspaceId:
              context.workspaceId,
            actorUserId:
              context.userId,
            opportunityId,
          });

        expect(first.queuedCount).toBe(0);

        expect(second).toMatchObject({
          opportunityId,
          queuedCount: 0,
          skippedCount: 1,
        });

        expect(
          second.deliveries,
        ).toHaveLength(2);

        expect(
          second.deliveries.every(
            (delivery) =>
              delivery.created === false,
          ),
        ).toBe(true);

        const deliveryCount =
          await prisma.notificationDelivery.count({
            where: {
              workspaceId:
                context.workspaceId,
              category:
                "OPPORTUNITY_AWARD_RESULT",
            },
          });

        expect(deliveryCount).toBe(2);

        const firstDeliveryIds =
          first.deliveries
            .map(
              (delivery) =>
                delivery.deliveryId,
            )
            .sort();

        const secondDeliveryIds =
          second.deliveries
            .map(
              (delivery) =>
                delivery.deliveryId,
            )
            .sort();

        expect(
          secondDeliveryIds,
        ).toEqual(firstDeliveryIds);
      },
    );


    it(
      "rejects award notification scheduling before the opportunity is awarded",
      async () => {
        const opportunity =
          await context.createOpportunity({
            status: "AWARD_PENDING",
            title:
              "منافسة غير مرساة لإشعارات النتيجة",
          });

        const partner =
          await prisma.businessPartner.create({
            data: {
              workspaceId:
                context.workspaceId,
              nameAr:
                "مورد اختبار إشعار مبكر",
              nameEn:
                "Early Notification Supplier",
              email:
                "early@example.com",
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
              "NOTIFY-NEG-001",
            status:
              "FINANCIALLY_EVALUATED",
            currency: "SAR",
            subtotal: "50000",
            taxAmount: "7500",
            totalAmount: "57500",
            submittedAt: new Date(),
          },
        });

        const service =
          new DefaultAwardNotificationApplicationService();

        await expect(
          service.queueForOpportunity({
            workspaceId:
              context.workspaceId,
            actorUserId:
              context.userId,
            opportunityId:
              opportunity.id,
          }),
        ).rejects.toThrow(
          "لا يمكن جدولة إشعارات الترسية قبل اعتماد نتيجة المنافسة.",
        );

        const deliveryCount =
          await prisma.notificationDelivery.count({
            where: {
              workspaceId:
                context.workspaceId,
              category:
                "OPPORTUNITY_AWARD_RESULT",
              recipient:
                "early@example.com",
            },
          });

        expect(deliveryCount).toBe(0);
      },
    );

    it(
      "returns zero deliveries for an awarded opportunity without final offer outcomes",
      async () => {
        const opportunity =
          await context.createOpportunity({
            status: "AWARDED",
            title:
              "منافسة مرساة بلا نتائج عروض نهائية",
          });

        const partner =
          await prisma.businessPartner.create({
            data: {
              workspaceId:
                context.workspaceId,
              nameAr:
                "مورد بلا نتيجة نهائية",
              nameEn:
                "No Final Outcome Supplier",
              email:
                "no-outcome@example.com",
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
              "NOTIFY-NEG-002",
            status:
              "FINANCIALLY_EVALUATED",
            currency: "SAR",
            subtotal: "60000",
            taxAmount: "9000",
            totalAmount: "69000",
            submittedAt: new Date(),
          },
        });

        const service =
          new DefaultAwardNotificationApplicationService();

        const result =
          await service.queueForOpportunity({
            workspaceId:
              context.workspaceId,
            actorUserId:
              context.userId,
            opportunityId:
              opportunity.id,
          });

        expect(result).toMatchObject({
          opportunityId:
            opportunity.id,
          queuedCount: 0,
          skippedCount: 0,
          deliveries: [],
        });

        const deliveryCount =
          await prisma.notificationDelivery.count({
            where: {
              workspaceId:
                context.workspaceId,
              category:
                "OPPORTUNITY_AWARD_RESULT",
              recipient:
                "no-outcome@example.com",
            },
          });

        expect(deliveryCount).toBe(0);
      },
    );

  },
);
