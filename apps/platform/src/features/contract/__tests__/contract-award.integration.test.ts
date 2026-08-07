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
  DefaultContractAwardApplicationService,
} from "../services";

import {
  createOpportunityTestContext,
  type OpportunityTestContext,
} from "@/features/opportunity/__tests__/builders";

describe.sequential(
  "Contract Award Integration",
  () => {
    let context: OpportunityTestContext;
    let opportunityId: string;
    let winningOfferId: string;
    let businessPartnerId: string;

    beforeAll(async () => {
      context =
        await createOpportunityTestContext([
          Permissions.contracts.create,
        ]);

      const opportunity =
        await context.createOpportunity({
          status: "AWARDED",
          title:
            "منافسة اختبار إنشاء العقد",
        });

      opportunityId = opportunity.id;

      const opportunityItem =
        await prisma.opportunityItem.create({
          data: {
            opportunityId,
            lineNumber: 1,
            description:
              "بند اختبار إنشاء العقد",
            quantity: "10",
            unit: "EA",
            specification:
              "مواصفات اختبارية",
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
              "المورد الفائز لإنشاء العقد",
            nameEn:
              "Contract Award Supplier",
            verificationStatus:
              "VERIFIED",
          },
          select: {
            id: true,
          },
        });

      businessPartnerId = partner.id;

      const winningOffer =
        await prisma.offer.create({
          data: {
            opportunityId,
            businessPartnerId:
              partner.id,
            referenceNumber:
              "CONTRACT-AWARD-001",
            status: "WINNER",
            currency: "SAR",
            subtotal: "100000",
            taxAmount: "15000",
            totalAmount: "115000",
            paymentTerms:
              "30 يومًا من تاريخ الفاتورة",
            deliveryDays: 45,
            submittedAt: new Date(),
          },
          select: {
            id: true,
          },
        });

      winningOfferId =
        winningOffer.id;

      await prisma.offerItem.create({
        data: {
          offerId:
            winningOffer.id,
          opportunityItemId:
            opportunityItem.id,
          unitPrice: "10000",
          quantity: "10",
          totalPrice: "100000",
          notes:
            "ملاحظة بند العرض",
        },
      });
    });

    afterAll(async () => {
      await context.cleanup();
      await prisma.$disconnect();
    });

    it(
      "creates a draft contract from the winning offer and copies commercial data and items",
      async () => {
        const service =
          new DefaultContractAwardApplicationService();

        const result =
          await service.createFromAward({
            workspaceId:
              context.workspaceId,
            actorUserId:
              context.userId,
            opportunityId,
          });

        expect(result.created).toBe(true);
        expect(result.contractId).toBeTruthy();
        expect(
          result.contractNumber,
        ).toBeTruthy();

        const contract =
          await prisma.contract.findUnique({
            where: {
              id: result.contractId,
            },
            include: {
              items: {
                orderBy: {
                  lineNumber: "asc",
                },
              },
            },
          });

        expect(contract).not.toBeNull();

        expect(contract).toMatchObject({
          workspaceId:
            context.workspaceId,
          opportunityId,
          sourceOfferId:
            winningOfferId,
          businessPartnerId,
          status: "DRAFT",
          currency: "SAR",
          paymentTerms:
            "30 يومًا من تاريخ الفاتورة",
          deliveryDays: 45,
          createdById:
            context.userId,
        });

        expect(
          contract?.subtotal.toString(),
        ).toBe("100000");

        expect(
          contract?.taxAmount.toString(),
        ).toBe("15000");

        expect(
          contract?.totalAmount.toString(),
        ).toBe("115000");

        expect(
          contract?.items,
        ).toHaveLength(1);

        expect(
          contract?.items[0],
        ).toMatchObject({
          lineNumber: 1,
          description:
            "بند اختبار إنشاء العقد",
          unit: "EA",
          notes:
            "ملاحظة بند العرض",
        });

        expect(
          contract?.items[0]?.quantity.toString(),
        ).toBe("10");

        expect(
          contract?.items[0]?.unitPrice.toString(),
        ).toBe("10000");

        expect(
          contract?.items[0]?.totalPrice.toString(),
        ).toBe("100000");

        const audit =
          await prisma.auditLog.findFirst({
            where: {
              workspaceId:
                context.workspaceId,
              entityId:
                result.contractId,
              action:
                "contract.created_from_award",
            },
          });

        expect(audit).not.toBeNull();

        expect(
          audit?.metadata,
        ).toMatchObject({
          contractNumber:
            result.contractNumber,
          opportunityId,
          sourceOfferId:
            winningOfferId,
          businessPartnerId,
          source:
            "CONTRACT_AWARD_APPLICATION_SERVICE",
        });
      },
    );

    it(
      "returns the existing contract without creating a duplicate",
      async () => {
        const service =
          new DefaultContractAwardApplicationService();

        const first =
          await service.createFromAward({
            workspaceId:
              context.workspaceId,
            actorUserId:
              context.userId,
            opportunityId,
          });

        const second =
          await service.createFromAward({
            workspaceId:
              context.workspaceId,
            actorUserId:
              context.userId,
            opportunityId,
          });

        expect(second).toMatchObject({
          contractId:
            first.contractId,
          contractNumber:
            first.contractNumber,
          created: false,
        });

        const contractCount =
          await prisma.contract.count({
            where: {
              sourceOfferId:
                winningOfferId,
            },
          });

        expect(contractCount).toBe(1);

        const auditCount =
          await prisma.auditLog.count({
            where: {
              workspaceId:
                context.workspaceId,
              entityId:
                first.contractId,
              action:
                "contract.created_from_award",
            },
          });

        expect(auditCount).toBe(1);
      },
    );


    it(
      "rejects contract creation when the opportunity is not awarded",
      async () => {
        const opportunity =
          await context.createOpportunity({
            status: "AWARD_PENDING",
            title:
              "منافسة غير مرساة لإنشاء العقد",
          });

        const partner =
          await prisma.businessPartner.create({
            data: {
              workspaceId:
                context.workspaceId,
              nameAr:
                "مورد اختبار منافسة غير مرساة",
              nameEn:
                "Unawarded Opportunity Supplier",
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
              "CONTRACT-NEG-001",
            status:
              "WINNER",
            currency: "SAR",
            subtotal: "50000",
            taxAmount: "7500",
            totalAmount: "57500",
            submittedAt: new Date(),
          },
        });

        const service =
          new DefaultContractAwardApplicationService();

        await expect(
          service.createFromAward({
            workspaceId:
              context.workspaceId,
            actorUserId:
              context.userId,
            opportunityId:
              opportunity.id,
          }),
        ).rejects.toThrow(
          "لا يمكن إنشاء عقد قبل ترسية المنافسة.",
        );

        expect(
          await prisma.contract.count({
            where: {
              opportunityId:
                opportunity.id,
            },
          }),
        ).toBe(0);

        expect(
          await prisma.auditLog.count({
            where: {
              workspaceId:
                context.workspaceId,
              action:
                "contract.created_from_award",
              metadata: {
                path: [
                  "opportunityId",
                ],
                equals:
                  opportunity.id,
              },
            },
          }),
        ).toBe(0);
      },
    );

    it(
      "rejects contract creation when no winning offer exists",
      async () => {
        const opportunity =
          await context.createOpportunity({
            status: "AWARDED",
            title:
              "منافسة مرساة دون عرض فائز",
          });

        const partner =
          await prisma.businessPartner.create({
            data: {
              workspaceId:
                context.workspaceId,
              nameAr:
                "مورد دون عرض فائز",
              nameEn:
                "No Winner Supplier",
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
              "CONTRACT-NEG-002",
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
          new DefaultContractAwardApplicationService();

        await expect(
          service.createFromAward({
            workspaceId:
              context.workspaceId,
            actorUserId:
              context.userId,
            opportunityId:
              opportunity.id,
          }),
        ).rejects.toThrow(
          "لم يتم العثور على العرض الفائز.",
        );

        expect(
          await prisma.contract.count({
            where: {
              opportunityId:
                opportunity.id,
            },
          }),
        ).toBe(0);
      },
    );

  },
);
