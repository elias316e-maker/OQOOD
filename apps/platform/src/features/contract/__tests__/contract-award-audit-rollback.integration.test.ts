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
  DefaultContractAwardApplicationService,
} from "../services";

import {
  ThrowingContractAwardAuditRepository,
} from "./fakes/throwing-contract-award-audit.repository";

describe.sequential(
  "Contract Award Audit Rollback Integration",
  () => {
    let context: OpportunityTestContext;
    let opportunityId: string;
    let winningOfferId: string;

    beforeAll(async () => {
      context =
        await createOpportunityTestContext([
          Permissions.contracts.create,
        ]);

      const opportunity =
        await context.createOpportunity({
          status: "AWARDED",
          title:
            "منافسة اختبار تراجع تدقيق إنشاء العقد",
        });

      opportunityId = opportunity.id;

      const opportunityItem =
        await prisma.opportunityItem.create({
          data: {
            opportunityId,
            lineNumber: 1,
            description:
              "بند اختبار التراجع",
            quantity: "5",
            unit: "EA",
          },
          select: {
            id: true,
          },
        });

      const partner =
        await prisma.businessPartner.create({
          data: {
            workspaceId:
              context.workspaceId,
            nameAr:
              "مورد اختبار تراجع التدقيق",
            nameEn:
              "Contract Audit Rollback Supplier",
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
              "CTR-AUDIT-RB-001",
            status: "WINNER",
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

      winningOfferId = offer.id;

      await prisma.offerItem.create({
        data: {
          offerId: offer.id,
          opportunityItemId:
            opportunityItem.id,
          unitPrice: "10000",
          quantity: "5",
          totalPrice: "50000",
        },
      });
    });

    afterAll(async () => {
      await context.cleanup();
      await prisma.$disconnect();
    });

    it(
      "rolls back the contract and its items when audit creation fails",
      async () => {
        const service =
          new DefaultContractAwardApplicationService(
            new ThrowingContractAwardAuditRepository(),
          );

        await expect(
          service.createFromAward({
            workspaceId:
              context.workspaceId,
            actorUserId:
              context.userId,
            opportunityId,
          }),
        ).rejects.toThrow(
          "Injected Contract Award Audit Failure",
        );

        const contractCount =
          await prisma.contract.count({
            where: {
              sourceOfferId:
                winningOfferId,
            },
          });

        expect(contractCount).toBe(0);

        const auditCount =
          await prisma.auditLog.count({
            where: {
              workspaceId:
                context.workspaceId,
              action:
                "contract.created_from_award",
            },
          });

        expect(auditCount).toBe(0);
      },
    );
  },
);
