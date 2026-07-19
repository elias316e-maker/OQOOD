import type { PrismaClient } from "../../../src/generated/prisma/client";
import { seedPlans } from "./plans";
import { seedFeatures } from "./features";
import { seedProfessionalEntitlements } from "./entitlements";
import { seedUsageMeters } from "./meters";

export async function seedBillingCatalog(prisma: PrismaClient) {
  console.log("Seeding OQOOD billing catalog...");

  const professionalPlan = await seedPlans(prisma);
  const features = await seedFeatures(prisma);

  await seedProfessionalEntitlements(
    prisma,
    professionalPlan.id,
    features,
  );

  await seedUsageMeters(prisma);

  console.log("OQOOD billing catalog seeded successfully.");
}
