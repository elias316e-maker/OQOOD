import "dotenv/config";
import { randomUUID } from "node:crypto";
import { parseArgs } from "node:util";

async function main() {
  const { values } = parseArgs({
    options: {
      help: { type: "boolean" },
      apply: { type: "boolean" },
      "user-id": { type: "string" },
      "expected-email": { type: "string" },
      "expected-db-name": { type: "string" },
      "operator-reference": { type: "string" },
    },
    strict: true,
    allowPositionals: false,
  });
  if (values.help || process.argv.length === 2) {
    console.log("Dry-run by default. Required: --user-id --expected-email --expected-db-name --operator-reference. Add --apply only after authorization.");
    return;
  }
  const userId = values["user-id"];
  const email = values["expected-email"];
  const database = values["expected-db-name"];
  const operator = values["operator-reference"];
  if (
    !userId || userId.length > 128 ||
    !email || email.length > 320 ||
    !database || database.length > 128 ||
    !operator?.trim() || operator.length > 200
  ) throw new Error("Invalid arguments.");

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Missing database configuration.");
  const url = new URL(connectionString);
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    decodeURIComponent(url.pathname.slice(1)) !== database
  ) throw new Error("Database target mismatch.");

  const { PrismaPg } = await import("@prisma/adapter-pg");
  const { PrismaClient } = await import("../src/generated/prisma/client");
  const { bootstrapPlatformAdministrator } = await import(
    "../src/features/platform-administration/bootstrap-platform-administrator"
  );
  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { twoFactors: true },
    });
    if (!user || user.email !== email) throw new Error("Account mismatch.");
    const factor = user.twoFactors[0];
    const eligible = Boolean(
      user.isActive && user.emailVerified && user.twoFactorEnabled === true &&
      user.twoFactors.length === 1 && factor?.verified && factor.secret &&
      (!factor.lockedUntil || factor.lockedUntil <= new Date())
    );
    const control = await db.platformAdministrationControl.findUnique({
      where: { id: "platform-administration" },
    });
    const count = await db.platformStaff.count();
    console.log("Database:", database, "User ID:", userId);
    console.log("Email matched. Eligible:", eligible);
    console.log("Existing staff:", count, "Bootstrapped:", Boolean(control?.bootstrappedAt));
    if (!eligible || count !== 0 || control?.bootstrappedAt) {
      throw new Error("Bootstrap preconditions failed.");
    }
    if (!values.apply) {
      console.log("Dry-run complete. Nothing was written.");
      return;
    }
    const result = await bootstrapPlatformAdministrator(db, {
      userId, operatorReference: operator.trim(), requestId: randomUUID(),
    });
    console.log("Created staff membership:", result.staffId);
    console.log("Administrative TOTP verification is still required.");
  } finally {
    await db.$disconnect();
  }
}
main().catch(() => {
  console.error("Bootstrap failed. Check arguments, target database, account eligibility and bootstrap state.");
  process.exitCode = 1;
});
