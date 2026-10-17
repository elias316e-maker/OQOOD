import type { PrismaClient } from "../../../src/generated/prisma/client";

export async function seedPlans(prisma: PrismaClient) {
  return prisma.plan.upsert({
    where: {
      code_version: {
        code: "PROFESSIONAL",
        version: 1,
      },
    },
    update: {
      nameAr: "الاحترافية",
      nameEn: "Professional",
      description:
        "الخطة الاحترافية لمساحات العمل المؤسسية في OQOOD.",
      status: "ACTIVE",
      isDefaultTrial: true,
      trialDays: 30,
    },
    create: {
      code: "PROFESSIONAL",
      version: 1,
      nameAr: "الاحترافية",
      nameEn: "Professional",
      description:
        "الخطة الاحترافية لمساحات العمل المؤسسية في OQOOD.",
      status: "ACTIVE",
      isDefaultTrial: true,
      trialDays: 30,
    },
  });
}
