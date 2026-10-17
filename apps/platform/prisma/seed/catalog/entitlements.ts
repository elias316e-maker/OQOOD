import type { PrismaClient } from "../../../src/generated/prisma/client";

const PROFESSIONAL_ENTITLEMENTS = [
  {
    featureKey: "workspace.members.max",
    value: 25,
    enforcementMode: "HARD" as const,
  },
  {
    featureKey: "procurement.projects.max",
    value: 50,
    enforcementMode: "HARD" as const,
  },
  {
    featureKey: "procurement.opportunities.monthly",
    value: 100,
    enforcementMode: "HARD" as const,
  },
  {
    featureKey: "storage.bytes.max",
    value: 10_737_418_240,
    enforcementMode: "HARD" as const,
  },
  {
    featureKey: "ai.credits.monthly",
    value: 1000,
    enforcementMode: "METERED" as const,
  },
  {
    featureKey: "reports.advanced.enabled",
    value: true,
    enforcementMode: "HARD" as const,
  },
  {
    featureKey: "approvals.workflow.enabled",
    value: true,
    enforcementMode: "HARD" as const,
  },
  {
    featureKey: "api.access.enabled",
    value: false,
    enforcementMode: "HARD" as const,
  },
];

export async function seedProfessionalEntitlements(
  prisma: PrismaClient,
  planId: string,
  features: Map<string, { id: string; key: string }>,
) {
  for (const entitlement of PROFESSIONAL_ENTITLEMENTS) {
    const feature = features.get(entitlement.featureKey);

    if (!feature) {
      throw new Error(
        `Feature definition not found: ${entitlement.featureKey}`,
      );
    }

    await prisma.planEntitlement.upsert({
      where: {
        planId_featureId: {
          planId,
          featureId: feature.id,
        },
      },
      update: {
        value: entitlement.value,
        enforcementMode: entitlement.enforcementMode,
      },
      create: {
        planId,
        featureId: feature.id,
        value: entitlement.value,
        enforcementMode: entitlement.enforcementMode,
      },
    });
  }
}
