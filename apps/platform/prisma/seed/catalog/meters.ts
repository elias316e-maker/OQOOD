import type { PrismaClient } from "../../../src/generated/prisma/client";

const USAGE_METERS = [
  {
    code: "ACTIVE_WORKSPACE_MEMBERS",
    name: "الأعضاء النشطون",
    description: "عدد أعضاء مساحة العمل النشطين.",
    aggregationType: "LAST" as const,
    resetPeriod: "NONE" as const,
    initialValue: 0,
  },
  {
    code: "ACTIVE_PROCUREMENT_PROJECTS",
    name: "مشروعات المشتريات النشطة",
    description: "عدد مشروعات المشتريات النشطة.",
    aggregationType: "LAST" as const,
    resetPeriod: "NONE" as const,
    initialValue: 0,
  },
  {
    code: "PROCUREMENT_OPPORTUNITIES_CREATED",
    name: "فرص المشتريات المنشأة",
    description: "عدد فرص المشتريات التي تم إنشاؤها.",
    aggregationType: "COUNT" as const,
    resetPeriod: "MONTHLY" as const,
    initialValue: 0,
  },
  {
    code: "STORAGE_BYTES",
    name: "استخدام التخزين",
    description: "إجمالي التخزين المستخدم بالبايت.",
    aggregationType: "LAST" as const,
    resetPeriod: "NONE" as const,
    initialValue: 0,
  },
  {
    code: "AI_CREDITS_USED",
    name: "أرصدة الذكاء الاصطناعي المستخدمة",
    description: "عدد أرصدة الذكاء الاصطناعي المستهلكة.",
    aggregationType: "SUM" as const,
    resetPeriod: "MONTHLY" as const,
    initialValue: 0,
  },
];

export async function seedUsageMeters(prisma: PrismaClient) {
  for (const meter of USAGE_METERS) {
    await prisma.usageMeter.upsert({
      where: {
        code: meter.code,
      },
      update: {
        name: meter.name,
        description: meter.description,
        aggregationType: meter.aggregationType,
        resetPeriod: meter.resetPeriod,
        initialValue: meter.initialValue,
        isActive: true,
      },
      create: {
        ...meter,
        isActive: true,
      },
    });
  }
}
