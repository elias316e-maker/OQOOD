import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { seedBillingCatalog } from "./seed/catalog";
import { seedPermissionCatalog } from "./seed/permissions";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing.");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  await seedBillingCatalog(prisma);
  await seedPermissionCatalog(prisma);

  const user = await prisma.user.upsert({
    where: {
      email: "admin@oqood.sa",
    },
    update: {},
    create: {
      name: "مدير منصة عقود",
      email: "admin@oqood.sa",
      isActive: true,
    },
  });

  const workspace = await prisma.workspace.upsert({
    where: {
      slug: "oqood-demo",
    },
    update: {},
    create: {
      code: "OQOOD-DEMO",
      slug: "oqood-demo",
      nameAr: "مساحة عقود التجريبية",
      nameEn: "OQOOD Demo Workspace",
      status: "ACTIVE",
      createdById: user.id,
    },
  });

  await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId: user.id,
      },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      userId: user.id,
      status: "ACTIVE",
    },
  });

  await prisma.company.upsert({
    where: {
      workspaceId_commercialRegister: {
        workspaceId: workspace.id,
        commercialRegister: "0000000000",
      },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      nameAr: "شركة عقود التجريبية",
      nameEn: "OQOOD Demo Company",
      commercialRegister: "0000000000",
      countryCode: "SA",
      city: "الرياض",
    },
  });

  console.log("Seed completed successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
