import type { PrismaClient } from "../../../src/generated/prisma/client";

const FEATURES = [
  {
    key: "workspace.members.max",
    name: "الحد الأقصى لأعضاء مساحة العمل",
    description: "أقصى عدد من الأعضاء النشطين داخل مساحة العمل.",
    valueType: "INTEGER" as const,
    defaultValue: 1,
  },
  {
    key: "procurement.projects.max",
    name: "الحد الأقصى لمشروعات المشتريات",
    description: "أقصى عدد من مشروعات المشتريات النشطة.",
    valueType: "INTEGER" as const,
    defaultValue: 0,
  },
  {
    key: "procurement.opportunities.monthly",
    name: "فرص المشتريات الشهرية",
    description: "عدد فرص المشتريات المسموح بإنشائها شهريًا.",
    valueType: "INTEGER" as const,
    defaultValue: 0,
  },
  {
    key: "storage.bytes.max",
    name: "الحد الأقصى للتخزين",
    description: "الحد الأقصى للتخزين بوحدة البايت.",
    valueType: "INTEGER" as const,
    defaultValue: 0,
  },
  {
    key: "ai.credits.monthly",
    name: "رصيد الذكاء الاصطناعي الشهري",
    description: "عدد أرصدة عمليات الذكاء الاصطناعي شهريًا.",
    valueType: "INTEGER" as const,
    defaultValue: 0,
  },
  {
    key: "reports.advanced.enabled",
    name: "التقارير المتقدمة",
    description: "إتاحة التقارير والتحليلات المتقدمة.",
    valueType: "BOOLEAN" as const,
    defaultValue: false,
  },
  {
    key: "approvals.workflow.enabled",
    name: "مسارات الاعتماد",
    description: "إتاحة مسارات الاعتماد والموافقات.",
    valueType: "BOOLEAN" as const,
    defaultValue: false,
  },
  {
    key: "api.access.enabled",
    name: "الوصول إلى API",
    description: "إتاحة الوصول إلى واجهات OQOOD البرمجية.",
    valueType: "BOOLEAN" as const,
    defaultValue: false,
  },
];

export async function seedFeatures(prisma: PrismaClient) {
  const features = new Map<string, { id: string; key: string }>();

  for (const feature of FEATURES) {
    const record = await prisma.featureDefinition.upsert({
      where: {
        key: feature.key,
      },
      update: {
        name: feature.name,
        description: feature.description,
        valueType: feature.valueType,
        defaultValue: feature.defaultValue,
        isActive: true,
      },
      create: {
        ...feature,
        isActive: true,
      },
      select: {
        id: true,
        key: true,
      },
    });

    features.set(record.key, record);
  }

  return features;
}
