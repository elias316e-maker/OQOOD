"use server";

import { revalidatePath } from "next/cache";

import {
  Prisma,
} from "@/generated/prisma/client";
import {
  Permissions,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

import {
  PrismaOpportunityAuthorizationGateway,
} from "../authorization";
import {
  resolveOpportunityActionContext,
} from "./helpers";

export type OpportunityOfferData = {
  opportunity: {
    id: string;
    number: string;
    title: string;
    status: string;
    currency: string;
  };
  items: Array<{
    id: string;
    lineNumber: number;
    description: string;
    quantity: string;
    unit: string;
  }>;
  partners: Array<{
    id: string;
    name: string;
  }>;
  offers: Array<{
    id: string;
    partnerName: string;
    referenceNumber: string | null;
    status: string;
    subtotal: string;
    taxAmount: string;
    totalAmount: string;
    deliveryDays: number | null;
    validityDays: number | null;
    createdAt: string;
  }>;
};

type Result<T> =
  | { success: true; data: T; message?: string }
  | { success: false; message: string };

type SaveOfferInput = {
  opportunityId: string;
  businessPartnerId: string;
  referenceNumber?: string;
  taxRate?: string;
  deliveryDays?: string;
  validityDays?: string;
  paymentTerms?: string;
  technicalNotes?: string;
  commercialNotes?: string;
  items: Array<{
    opportunityItemId: string;
    unitPrice: string;
    notes?: string;
  }>;
};

function message(error: unknown): string {
  return error instanceof Error && error.message.trim()
    ? error.message
    : "تعذر تنفيذ العملية.";
}

export async function getOpportunityOffersAction(
  opportunityId: string,
): Promise<Result<OpportunityOfferData>> {
  try {
    const context = await resolveOpportunityActionContext();
    const authorization =
      new PrismaOpportunityAuthorizationGateway();

    const data = await prisma.$transaction(
      async (transaction) => {
        await authorization.authorize(transaction, {
          workspaceId: context.workspaceId,
          actorUserId: context.actorUserId,
          permission: Permissions.opportunities.read,
          requireWriteAccess: false,
        });

        const opportunity =
          await transaction.opportunity.findFirst({
            where: {
              id: opportunityId,
              workspaceId: context.workspaceId,
            },
            select: {
              id: true,
              number: true,
              title: true,
              status: true,
              currency: true,
              items: {
                orderBy: { lineNumber: "asc" },
                select: {
                  id: true,
                  lineNumber: true,
                  description: true,
                  quantity: true,
                  unit: true,
                },
              },
              invitations: {
                select: {
                  businessPartner: {
                    select: {
                      id: true,
                      nameAr: true,
                    },
                  },
                },
              },
              offers: {
                orderBy: { createdAt: "desc" },
                select: {
                  id: true,
                  referenceNumber: true,
                  status: true,
                  subtotal: true,
                  taxAmount: true,
                  totalAmount: true,
                  deliveryDays: true,
                  validityDays: true,
                  createdAt: true,
                  businessPartner: {
                    select: { nameAr: true },
                  },
                },
              },
            },
          });

        if (!opportunity) {
          throw new Error("لم يتم العثور على المنافسة.");
        }

        return {
          opportunity: {
            id: opportunity.id,
            number: opportunity.number,
            title: opportunity.title,
            status: opportunity.status,
            currency: opportunity.currency,
          },
          items: opportunity.items.map((item) => ({
            ...item,
            quantity: item.quantity.toString(),
          })),
          partners: opportunity.invitations.map(
            ({ businessPartner }) => ({
              id: businessPartner.id,
              name: businessPartner.nameAr,
            }),
          ),
          offers: opportunity.offers.map((offer) => ({
            id: offer.id,
            partnerName: offer.businessPartner.nameAr,
            referenceNumber: offer.referenceNumber,
            status: offer.status,
            subtotal: offer.subtotal?.toString() ?? "0",
            taxAmount: offer.taxAmount?.toString() ?? "0",
            totalAmount: offer.totalAmount?.toString() ?? "0",
            deliveryDays: offer.deliveryDays,
            validityDays: offer.validityDays,
            createdAt: offer.createdAt.toISOString(),
          })),
        };
      },
    );

    return { success: true, data };
  } catch (error) {
    return { success: false, message: message(error) };
  }
}

export async function saveOpportunityOfferAction(
  input: SaveOfferInput,
): Promise<Result<{ offerId: string }>> {
  try {
    const context = await resolveOpportunityActionContext();
    const authorization =
      new PrismaOpportunityAuthorizationGateway();

    const result = await prisma.$transaction(
      async (transaction) => {
        await authorization.authorize(transaction, {
          workspaceId: context.workspaceId,
          actorUserId: context.actorUserId,
          permission: Permissions.opportunities.evaluate,
          requireWriteAccess: true,
        });

        const opportunity =
          await transaction.opportunity.findFirst({
            where: {
              id: input.opportunityId,
              workspaceId: context.workspaceId,
            },
            include: {
              items: true,
              invitations: {
                where: {
                  businessPartnerId:
                    input.businessPartnerId,
                },
                select: { id: true },
              },
            },
          });

        if (!opportunity) {
          throw new Error("لم يتم العثور على المنافسة.");
        }
        if (
          opportunity.status === "ARCHIVED" ||
          opportunity.status === "CANCELLED"
        ) {
          throw new Error(
            "لا يمكن تسجيل عرض على منافسة مغلقة.",
          );
        }
        if (opportunity.invitations.length === 0) {
          throw new Error(
            "المورد المحدد غير مدعو لهذه المنافسة.",
          );
        }
        if (
          input.items.length !== opportunity.items.length ||
          input.items.length === 0
        ) {
          throw new Error(
            "يجب تسعير جميع بنود المنافسة.",
          );
        }

        const quantities = new Map(
          opportunity.items.map((item) => [
            item.id,
            item.quantity,
          ]),
        );
        let subtotal = new Prisma.Decimal(0);
        const normalizedItems = input.items.map((item) => {
          const quantity = quantities.get(
            item.opportunityItemId,
          );
          const unitPrice = new Prisma.Decimal(item.unitPrice);
          if (!quantity || unitPrice.isNegative()) {
            throw new Error("تتضمن بنود العرض سعراً غير صالح.");
          }
          const totalPrice = quantity.mul(unitPrice);
          subtotal = subtotal.add(totalPrice);
          return {
            opportunityItemId: item.opportunityItemId,
            quantity,
            unitPrice,
            totalPrice,
            notes: item.notes?.trim() || null,
          };
        });
        const taxRate = new Prisma.Decimal(
          input.taxRate?.trim() || "0",
        );
        if (taxRate.isNegative() || taxRate.greaterThan(100)) {
          throw new Error("نسبة الضريبة غير صالحة.");
        }
        const taxAmount = subtotal.mul(taxRate).div(100);
        const totalAmount = subtotal.add(taxAmount);

        const offer = await transaction.offer.upsert({
          where: {
            opportunityId_businessPartnerId: {
              opportunityId: opportunity.id,
              businessPartnerId: input.businessPartnerId,
            },
          },
          create: {
            opportunityId: opportunity.id,
            businessPartnerId: input.businessPartnerId,
            referenceNumber:
              input.referenceNumber?.trim() || null,
            status: "SUBMITTED",
            currency: opportunity.currency,
            subtotal,
            taxAmount,
            totalAmount,
            deliveryDays: input.deliveryDays
              ? Number(input.deliveryDays)
              : null,
            validityDays: input.validityDays
              ? Number(input.validityDays)
              : null,
            paymentTerms: input.paymentTerms?.trim() || null,
            technicalNotes:
              input.technicalNotes?.trim() || null,
            commercialNotes:
              input.commercialNotes?.trim() || null,
            submittedAt: new Date(),
          },
          update: {
            referenceNumber:
              input.referenceNumber?.trim() || null,
            status: "SUBMITTED",
            subtotal,
            taxAmount,
            totalAmount,
            deliveryDays: input.deliveryDays
              ? Number(input.deliveryDays)
              : null,
            validityDays: input.validityDays
              ? Number(input.validityDays)
              : null,
            paymentTerms: input.paymentTerms?.trim() || null,
            technicalNotes:
              input.technicalNotes?.trim() || null,
            commercialNotes:
              input.commercialNotes?.trim() || null,
            submittedAt: new Date(),
          },
          select: { id: true },
        });

        await transaction.offerItem.deleteMany({
          where: { offerId: offer.id },
        });
        await transaction.offerItem.createMany({
          data: normalizedItems.map((item) => ({
            offerId: offer.id,
            ...item,
          })),
        });
        await transaction.auditLog.create({
          data: {
            workspaceId: context.workspaceId,
            userId: context.actorUserId,
            action: "offer.submitted",
            entityType: "Offer",
            entityId: offer.id,
            metadata: {
              opportunityId: opportunity.id,
              businessPartnerId: input.businessPartnerId,
              totalAmount: totalAmount.toString(),
            },
          },
        });

        return { offerId: offer.id };
      },
    );

    revalidatePath(
      `/platform/opportunities/${input.opportunityId}/offers`,
    );
    return {
      success: true,
      data: result,
      message: "تم تسجيل عرض المورد بنجاح.",
    };
  } catch (error) {
    return { success: false, message: message(error) };
  }
}
