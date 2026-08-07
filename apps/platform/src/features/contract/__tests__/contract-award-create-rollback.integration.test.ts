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
  ThrowingContractAwardCreateRepository,
} from "./fakes/throwing-contract-award-create.repository";

describe.sequential(
  "Contract Award Creation Rollback Integration",
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
            "منافسة اختبار فشل إنشاء العقد",
        });

      opportunityId = opportunity.id;

      const partner =
        await prisma.businessPartner.create({
          data: {
            workspaceId:
              context.workspaceId,
            nameAr:
              "مورد اختبار فشل إنشاء العقد",
            nameEn:
              "Contract Creation Failure Supplier",
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
              "CTR-CREATE-RB-001",
            status: "WINNER",
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

      winningOfferId = offer.id;
    });

    afterAll(async () => {
      await context.cleanup();
      await prisma.$disconnect();
    });

    it(
      "does not create audit data when contract creation fails",
      async () => {
        const service =
          new DefaultContractAwardApplicationService(
            new ThrowingContractAwardCreateRepository(),
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
          "Injected Contract Award Creation Failure",
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
