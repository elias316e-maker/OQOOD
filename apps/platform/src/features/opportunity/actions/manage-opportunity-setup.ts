"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  Prisma,
} from "@/generated/prisma/client";

import {
  Permissions,
} from "@/lib/permissions";

import {
  prisma,
} from "@/lib/prisma";

import {
  PrismaOpportunityAuthorizationGateway,
} from "../authorization";

import {
  resolveOpportunityActionContext,
} from "./helpers";

export type OpportunityItemInput = {
  id?: string;
  description: string;
  quantity: string;
  unit: string;
  specification?: string;
};

export type OpportunitySetupData = {
  opportunity: {
    id: string;
    number: string;
    title: string;
    status: string;
  };
  items: Array<{
    id: string;
    description: string;
    quantity: string;
    unit: string;
    specification: string;
  }>;
  partners: Array<{
    id: string;
    name: string;
    city: string;
    trustScore: string;
    verified: boolean;
  }>;
  invitation: {
    partnerIds: string[];
    message: string;
  };
};

export type OpportunitySetupActionResult<T> =
  | {
      success: true;
      data: T;
      message?: string;
    }
  | {
      success: false;
      message: string;
    };

function errorMessage(error: unknown): string {
  if (
    error instanceof Error &&
    error.message.trim()
  ) {
    return error.message;
  }

  return "تعذر تنفيذ العملية. حاول مرة أخرى.";
}

function revalidateSetup(
  opportunityId: string,
): void {
  revalidatePath(
    `/platform/opportunities/${opportunityId}`,
  );
  revalidatePath(
    `/platform/opportunities/${opportunityId}/boq`,
  );
  revalidatePath(
    `/platform/opportunities/${opportunityId}/partners`,
  );
}

export async function getOpportunitySetupAction(
  opportunityId: string,
): Promise<
  OpportunitySetupActionResult<OpportunitySetupData>
> {
  try {
    const context =
      await resolveOpportunityActionContext();
    const authorization =
      new PrismaOpportunityAuthorizationGateway();

    const data = await prisma.$transaction(
      async (transaction) => {
        await authorization.authorize(
          transaction,
          {
            workspaceId: context.workspaceId,
            actorUserId: context.actorUserId,
            permission:
              Permissions.opportunities.read,
            requireWriteAccess: false,
          },
        );

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
              items: {
                orderBy: {
                  lineNumber: "asc",
                },
                select: {
                  id: true,
                  description: true,
                  quantity: true,
                  unit: true,
                  specification: true,
                },
              },
              invitations: {
                select: {
                  businessPartnerId: true,
                  message: true,
                },
              },
            },
          });

        if (!opportunity) {
          throw new Error(
            "لم يتم العثور على الفرصة المطلوبة.",
          );
        }

        const partners =
          await transaction.businessPartner.findMany({
            where: {
              workspaceId: context.workspaceId,
            },
            orderBy: [
              {
                verificationStatus: "desc",
              },
              {
                trustScore: "desc",
              },
              {
                nameAr: "asc",
              },
            ],
            select: {
              id: true,
              nameAr: true,
              city: true,
              trustScore: true,
              verificationStatus: true,
            },
          });

        return {
          opportunity: {
            id: opportunity.id,
            number: opportunity.number,
            title: opportunity.title,
            status: opportunity.status,
          },
          items: opportunity.items.map(
            (item) => ({
              id: item.id,
              description: item.description,
              quantity: item.quantity.toString(),
              unit: item.unit,
              specification:
                item.specification ?? "",
            }),
          ),
          partners: partners.map(
            (partner) => ({
              id: partner.id,
              name: partner.nameAr,
              city:
                partner.city ?? "غير محددة",
              trustScore:
                partner.trustScore?.toString() ??
                "—",
              verified:
                partner.verificationStatus ===
                "VERIFIED",
            }),
          ),
          invitation: {
            partnerIds:
              opportunity.invitations.map(
                (invitation) =>
                  invitation.businessPartnerId,
              ),
            message:
              opportunity.invitations[0]
                ?.message ?? "",
          },
        };
      },
    );

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      message: errorMessage(error),
    };
  }
}

export async function saveOpportunityItemsAction(
  opportunityId: string,
  items: OpportunityItemInput[],
): Promise<
  OpportunitySetupActionResult<{
    count: number;
  }>
> {
  try {
    const normalizedItems = items.map(
      (item, index) => ({
        lineNumber: index + 1,
        description:
          item.description.trim(),
        quantity: item.quantity.trim(),
        unit: item.unit.trim(),
        specification:
          item.specification?.trim() || null,
      }),
    );

    if (
      normalizedItems.length === 0 ||
      normalizedItems.length > 100
    ) {
      throw new Error(
        "يجب إضافة بند واحد على الأقل، وبحد أقصى 100 بند.",
      );
    }

    for (const item of normalizedItems) {
      if (
        !item.description ||
        !item.unit ||
        !Number.isFinite(
          Number(item.quantity),
        ) ||
        Number(item.quantity) <= 0
      ) {
        throw new Error(
          `تحقق من بيانات البند رقم ${item.lineNumber}.`,
        );
      }
    }

    const context =
      await resolveOpportunityActionContext();
    const authorization =
      new PrismaOpportunityAuthorizationGateway();

    await prisma.$transaction(
      async (transaction) => {
        await authorization.authorize(
          transaction,
          {
            workspaceId: context.workspaceId,
            actorUserId: context.actorUserId,
            permission:
              Permissions.opportunities.update,
            requireWriteAccess: true,
          },
        );

        const opportunity =
          await transaction.opportunity.findFirst({
            where: {
              id: opportunityId,
              workspaceId: context.workspaceId,
            },
            select: {
              id: true,
              number: true,
              status: true,
            },
          });

        if (!opportunity) {
          throw new Error(
            "لم يتم العثور على الفرصة المطلوبة.",
          );
        }

        if (
          opportunity.status === "ARCHIVED"
        ) {
          throw new Error(
            "لا يمكن تعديل فرصة مؤرشفة.",
          );
        }

        await transaction.opportunityItem.deleteMany({
          where: {
            opportunityId,
          },
        });

        await transaction.opportunityItem.createMany({
          data: normalizedItems.map(
            (item) => ({
              opportunityId,
              lineNumber: item.lineNumber,
              description:
                item.description,
              quantity:
                new Prisma.Decimal(
                  item.quantity,
                ),
              unit: item.unit,
              specification:
                item.specification,
            }),
          ),
        });

        await transaction.auditLog.create({
          data: {
            workspaceId: context.workspaceId,
            userId: context.actorUserId,
            action:
              "opportunity.items.updated",
            entityType: "Opportunity",
            entityId: opportunity.id,
            metadata: {
              number: opportunity.number,
              itemCount:
                normalizedItems.length,
            },
          },
        });
      },
    );

    revalidateSetup(opportunityId);

    return {
      success: true,
      data: {
        count: normalizedItems.length,
      },
      message:
        "تم حفظ جدول الكميات بنجاح.",
    };
  } catch (error) {
    return {
      success: false,
      message: errorMessage(error),
    };
  }
}

export async function saveOpportunityInvitationsAction(
  opportunityId: string,
  partnerIds: string[],
  message: string,
): Promise<
  OpportunitySetupActionResult<{
    count: number;
  }>
> {
  try {
    const uniquePartnerIds = [
      ...new Set(
        partnerIds
          .map((value) => value.trim())
          .filter(Boolean),
      ),
    ];

    if (uniquePartnerIds.length === 0) {
      throw new Error(
        "اختر شريك أعمال واحدًا على الأقل.",
      );
    }

    const context =
      await resolveOpportunityActionContext();
    const authorization =
      new PrismaOpportunityAuthorizationGateway();

    await prisma.$transaction(
      async (transaction) => {
        await authorization.authorize(
          transaction,
          {
            workspaceId: context.workspaceId,
            actorUserId: context.actorUserId,
            permission:
              Permissions.opportunities.update,
            requireWriteAccess: true,
          },
        );

        const opportunity =
          await transaction.opportunity.findFirst({
            where: {
              id: opportunityId,
              workspaceId: context.workspaceId,
            },
            select: {
              id: true,
              number: true,
              status: true,
            },
          });

        if (!opportunity) {
          throw new Error(
            "لم يتم العثور على الفرصة المطلوبة.",
          );
        }

        if (
          opportunity.status === "ARCHIVED"
        ) {
          throw new Error(
            "لا يمكن تعديل فرصة مؤرشفة.",
          );
        }

        const partnerCount =
          await transaction.businessPartner.count({
            where: {
              workspaceId: context.workspaceId,
              id: {
                in: uniquePartnerIds,
              },
            },
          });

        if (
          partnerCount !==
          uniquePartnerIds.length
        ) {
          throw new Error(
            "تتضمن الدعوة شريكًا غير صالح لمساحة العمل.",
          );
        }

        await transaction.opportunityInvitation.deleteMany({
          where: {
            opportunityId,
            status: "PENDING",
          },
        });

        await transaction.opportunityInvitation.createMany({
          data: uniquePartnerIds.map(
            (businessPartnerId) => ({
              opportunityId,
              businessPartnerId,
              status: "PENDING",
              message:
                message.trim() || null,
            }),
          ),
          skipDuplicates: true,
        });

        await transaction.auditLog.create({
          data: {
            workspaceId: context.workspaceId,
            userId: context.actorUserId,
            action:
              "opportunity.invitations.updated",
            entityType: "Opportunity",
            entityId: opportunity.id,
            metadata: {
              number: opportunity.number,
              partnerCount:
                uniquePartnerIds.length,
            },
          },
        });
      },
    );

    revalidateSetup(opportunityId);

    return {
      success: true,
      data: {
        count: uniquePartnerIds.length,
      },
      message:
        "تم حفظ شركاء الأعمال المدعوين.",
    };
  } catch (error) {
    return {
      success: false,
      message: errorMessage(error),
    };
  }
}

