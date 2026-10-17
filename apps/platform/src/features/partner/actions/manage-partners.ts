"use server";

import { revalidatePath } from "next/cache";

import { Permissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { PrismaOpportunityAuthorizationGateway } from "@/features/opportunity/authorization";
import { resolveOpportunityActionContext } from "@/features/opportunity/actions/helpers";

export type PartnerRoleValue =
  | "SUPPLIER"
  | "CONTRACTOR"
  | "CONSULTANT"
  | "MANUFACTURER"
  | "DISTRIBUTOR"
  | "SERVICE_PROVIDER"
  | "LOGISTICS_PROVIDER"
  | "INVESTMENT_PARTNER";

export type CreatePartnerInput = {
  nameAr: string;
  nameEn?: string;
  commercialRegister?: string;
  taxNumber?: string;
  email?: string;
  phone?: string;
  website?: string;
  city?: string;
  roles: PartnerRoleValue[];
};

export type PartnerActionResult<T> =
  | { success: true; data: T; message?: string }
  | { success: false; message: string };

const partnerRoles = new Set<PartnerRoleValue>([
  "SUPPLIER",
  "CONTRACTOR",
  "CONSULTANT",
  "MANUFACTURER",
  "DISTRIBUTOR",
  "SERVICE_PROVIDER",
  "LOGISTICS_PROVIDER",
  "INVESTMENT_PARTNER",
]);

function clean(value?: string): string | undefined {
  const normalized = value?.trim();
  return normalized || undefined;
}

function errorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  ) {
    return "يوجد شريك أعمال مسجل بنفس رقم السجل التجاري.";
  }

  return error instanceof Error && error.message.trim()
    ? error.message
    : "تعذر تنفيذ العملية. حاول مرة أخرى.";
}

export async function listPartnersAction(): Promise<
  PartnerActionResult<
    Array<{
      id: string;
      nameAr: string;
      nameEn: string;
      commercialRegister: string;
      email: string;
      phone: string;
      city: string;
      verificationStatus: string;
      roles: PartnerRoleValue[];
      invitationCount: number;
      createdAt: string;
    }>
  >
> {
  try {
    const context = await resolveOpportunityActionContext();
    const authorization =
      new PrismaOpportunityAuthorizationGateway();

    const partners = await prisma.$transaction(
      async (transaction) => {
        await authorization.authorize(transaction, {
          workspaceId: context.workspaceId,
          actorUserId: context.actorUserId,
          permission: Permissions.vendors.read,
          requireWriteAccess: false,
        });

        return transaction.businessPartner.findMany({
          where: { workspaceId: context.workspaceId },
          orderBy: [{ createdAt: "desc" }, { nameAr: "asc" }],
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            commercialRegister: true,
            email: true,
            phone: true,
            city: true,
            verificationStatus: true,
            createdAt: true,
            roles: { select: { role: true } },
            _count: { select: { invitations: true } },
          },
        });
      },
    );

    return {
      success: true,
      data: partners.map((partner) => ({
        id: partner.id,
        nameAr: partner.nameAr,
        nameEn: partner.nameEn ?? "",
        commercialRegister:
          partner.commercialRegister ?? "",
        email: partner.email ?? "",
        phone: partner.phone ?? "",
        city: partner.city ?? "",
        verificationStatus:
          partner.verificationStatus,
        roles: partner.roles.map(
          ({ role }) => role as PartnerRoleValue,
        ),
        invitationCount: partner._count.invitations,
        createdAt: partner.createdAt.toISOString(),
      })),
    };
  } catch (error) {
    return { success: false, message: errorMessage(error) };
  }
}

export async function createPartnerAction(
  input: CreatePartnerInput,
): Promise<
  PartnerActionResult<{ partnerId: string }>
> {
  try {
    const nameAr = input.nameAr.trim();
    const roles = [...new Set(input.roles)].filter(
      (role): role is PartnerRoleValue =>
        partnerRoles.has(role),
    );

    if (nameAr.length < 2 || nameAr.length > 160) {
      return {
        success: false,
        message:
          "اسم الشريك مطلوب ويجب أن يكون بين حرفين و160 حرفًا.",
      };
    }

    if (roles.length === 0) {
      return {
        success: false,
        message: "اختر تصنيفًا واحدًا على الأقل.",
      };
    }

    const email = clean(input.email);
    if (
      email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return {
        success: false,
        message: "أدخل بريدًا إلكترونيًا صحيحًا.",
      };
    }

    const context = await resolveOpportunityActionContext();
    const authorization =
      new PrismaOpportunityAuthorizationGateway();

    const partner = await prisma.$transaction(
      async (transaction) => {
        await authorization.authorize(transaction, {
          workspaceId: context.workspaceId,
          actorUserId: context.actorUserId,
          permission: Permissions.vendors.create,
          requireWriteAccess: true,
        });

        const created =
          await transaction.businessPartner.create({
            data: {
              workspaceId: context.workspaceId,
              nameAr,
              nameEn: clean(input.nameEn),
              commercialRegister: clean(
                input.commercialRegister,
              ),
              taxNumber: clean(input.taxNumber),
              email,
              phone: clean(input.phone),
              website: clean(input.website),
              city: clean(input.city),
              countryCode: "SA",
              roles: {
                create: roles.map((role) => ({ role })),
              },
            },
            select: { id: true },
          });

        await transaction.auditLog.create({
          data: {
            workspaceId: context.workspaceId,
            userId: context.actorUserId,
            action: "business-partner.created",
            entityType: "BusinessPartner",
            entityId: created.id,
            metadata: { nameAr, roles },
          },
        });

        return created;
      },
    );

    revalidatePath("/platform/partners");
    revalidatePath("/platform/opportunities");

    return {
      success: true,
      data: { partnerId: partner.id },
      message: "تمت إضافة شريك الأعمال بنجاح.",
    };
  } catch (error) {
    return { success: false, message: errorMessage(error) };
  }
}

