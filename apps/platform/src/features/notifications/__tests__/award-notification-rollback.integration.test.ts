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

import {
  ThrowingAwardNotificationDeliveryRepository,
} from "./fakes/throwing-award-notification-delivery.repository";

describe.sequential(
  "Award Notification Rollback Integration",
  () => {
    let context: OpportunityTestContext;
    let opportunityId: string;

    beforeAll(async () => {
      context =
        await createOpportunityTestContext([
          Permissions.opportunities.read,
        ]);

      const opportunity =
        await context.createOpportunity({
          status: "AWARDED",
          title:
            "منافسة اختبار تراجع إشعارات الترسية",
        });

      opportunityId = opportunity.id;

      const [
        winnerPartner,
        loserPartner,
      ] = await Promise.all([
        prisma.businessPartner.create({
          data: {
            workspaceId:
              context.workspaceId,
            nameAr:
              "مورد فائز لاختبار التراجع",
            nameEn:
              "Rollback Winner Supplier",
            email:
              "rollback-winner@example.com",
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
              "مورد خاسر لاختبار التراجع",
            nameEn:
              "Rollback Loser Supplier",
            email:
              "rollback-loser@example.com",
            verificationStatus:
              "VERIFIED",
          },
          select: {
            id: true,
          },
        }),
      ]);

      await Promise.all([
        prisma.offer.create({
          data: {
            opportunityId,
            businessPartnerId:
              winnerPartner.id,
            referenceNumber:
              "NOTIFY-RB-WINNER",
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
              "NOTIFY-RB-LOSER",
            status: "LOST",
            currency: "SAR",
            subtotal: "120000",
            taxAmount: "18000",
            totalAmount: "138000",
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
      "rolls back the entire notification batch when one delivery creation fails",
      async () => {
        const service =
          new DefaultAwardNotificationApplicationService(
            new ThrowingAwardNotificationDeliveryRepository(),
          );

        await expect(
          service.queueForOpportunity({
            workspaceId:
              context.workspaceId,
            actorUserId:
              context.userId,
            opportunityId,
          }),
        ).rejects.toThrow(
          "Injected Award Notification Delivery Failure",
        );

        const deliveryCount =
          await prisma.notificationDelivery.count({
            where: {
              workspaceId:
                context.workspaceId,
              category:
                "OPPORTUNITY_AWARD_RESULT",
              recipient: {
                in: [
                  "rollback-winner@example.com",
                  "rollback-loser@example.com",
                ],
              },
            },
          });

        expect(deliveryCount).toBe(0);

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
        ).toBe("AWARDED");

        const offerStatuses =
          await prisma.offer.findMany({
            where: {
              opportunityId,
            },
            select: {
              status: true,
            },
          });

        expect(
          offerStatuses.map(
            (offer) => offer.status,
          ),
        ).toEqual(
          expect.arrayContaining([
            "WINNER",
            "LOST",
          ]),
        );
      },
    );
  },
);
