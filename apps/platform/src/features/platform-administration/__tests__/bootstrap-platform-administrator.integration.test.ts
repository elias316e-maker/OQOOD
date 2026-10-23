import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import {
  bootstrapPlatformAdministrator,
} from "../bootstrap-platform-administrator";

const databaseUrl = process.env.ADMIN_BOOTSTRAP_TEST_DATABASE_URL;

describe.skipIf(!databaseUrl)("platform administrator bootstrap", () => {
  let db: PrismaClient;

  beforeAll(() => {
    const url = new URL(databaseUrl!);
    if (
      !["127.0.0.1", "localhost"].includes(url.hostname) ||
      url.pathname !== "/oqood_admin_bootstrap_test"
    ) {
      throw new Error("A dedicated local bootstrap test database is required.");
    }
    db = new PrismaClient({
      adapter: new PrismaPg({ connectionString: databaseUrl! }),
    });
  });

  beforeEach(async () => {
    // This database is dedicated to this test file.
    await db.platformSessionAssurance.deleteMany();
    await db.platformAuditLog.deleteMany();
    await db.platformStaff.deleteMany();
    await db.platformAdministrationControl.deleteMany();
  });

  afterAll(async () => {
    await db?.$disconnect();
  });

  async function eligibleUser() {
    return db.user.create({
      data: {
        name: "Bootstrap test",
        email: `${randomUUID()}@example.invalid`,
        emailVerified: true,
        isActive: true,
        twoFactorEnabled: true,
        twoFactors: {
          create: {
            id: randomUUID(),
            secret: "encrypted-test-fixture-only",
            backupCodes: "test-fixture-only",
            verified: true,
          },
        },
      },
      select: { id: true },
    });
  }

  function input(userId: string, requestId: string = randomUUID()) {
    return {
      userId,
      requestId,
      operatorReference: "isolated-test-operator",
    };
  }

  it("creates one administrator with audit but without session assurance", async () => {
    const user = await eligibleUser();
    const request = input(user.id);
    const result = await bootstrapPlatformAdministrator(db, request);

    const staff = await db.platformStaff.findUniqueOrThrow({
      where: { id: result.staffId },
    });
    expect(staff.userId).toBe(user.id);
    expect(staff.role).toBe("PLATFORM_ADMIN");
    expect(staff.status).toBe("ACTIVE");
    expect(staff.authorizationVersion).toBe(1);
    expect(await db.platformSessionAssurance.count()).toBe(0);

    const audit = await db.platformAuditLog.findFirstOrThrow({
      where: { requestId: request.requestId },
    });
    expect(audit.actorUserId).toBe("system:platform-bootstrap");
    expect(audit.targetId).toBe(result.staffId);
    expect(audit.action).toBe("platform.staff.bootstrap");
    expect(audit.metadata).toMatchObject({
      operatorReference: request.operatorReference,
      targetUserId: user.id,
    });

    const control = await db.platformAdministrationControl.findUniqueOrThrow({
      where: { id: "platform-administration" },
    });
    expect(control.bootstrappedAt).toBeInstanceOf(Date);
  });

  it("rejects repeated provisioning", async () => {
    const first = await eligibleUser();
    const second = await eligibleUser();
    await bootstrapPlatformAdministrator(db, input(first.id));
    await expect(
      bootstrapPlatformAdministrator(db, input(second.id)),
    ).rejects.toThrow();
    expect(await db.platformStaff.count()).toBe(1);
    expect(await db.platformAuditLog.count()).toBe(1);
  });

  it("accepts exactly one concurrent bootstrap", async () => {
    const users = await Promise.all([eligibleUser(), eligibleUser()]);
    const results = await Promise.allSettled(
      users.map((user) => bootstrapPlatformAdministrator(db, input(user.id))),
    );
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
    expect(await db.platformStaff.count()).toBe(1);
    expect(await db.platformAuditLog.count()).toBe(1);
  });

  it.each([
    "inactive",
    "unverified-email",
    "disabled-factor",
    "unverified-factor",
    "missing-factor",
    "multiple-factors",
    "locked-factor",
  ])("rejects an ineligible account: %s", async (scenario) => {
    const user = await eligibleUser();

    if (scenario === "inactive") {
      await db.user.update({
        where: { id: user.id }, data: { isActive: false },
      });
    } else if (scenario === "unverified-email") {
      await db.user.update({
        where: { id: user.id }, data: { emailVerified: false },
      });
    } else if (scenario === "disabled-factor") {
      await db.user.update({
        where: { id: user.id }, data: { twoFactorEnabled: false },
      });
    } else if (scenario === "unverified-factor") {
      await db.twoFactor.updateMany({
        where: { userId: user.id }, data: { verified: false },
      });
    } else if (scenario === "missing-factor") {
      await db.twoFactor.deleteMany({ where: { userId: user.id } });
    } else if (scenario === "multiple-factors") {
      await db.twoFactor.create({
        data: {
          id: randomUUID(),
          userId: user.id,
          secret: "second-test-factor",
          backupCodes: "test-only",
          verified: true,
        },
      });
    } else {
      await db.twoFactor.updateMany({
        where: { userId: user.id },
        data: { lockedUntil: new Date(Date.now() + 60_000) },
      });
    }

    await expect(
      bootstrapPlatformAdministrator(db, input(user.id)),
    ).rejects.toThrow();
    expect(await db.platformStaff.count()).toBe(0);
    expect(await db.platformAuditLog.count()).toBe(0);
    expect(await db.platformAdministrationControl.count()).toBe(0);
  });

  it("does not promote an existing suspended staff membership", async () => {
    const user = await eligibleUser();
    await db.platformStaff.create({
      data: { userId: user.id, role: "SUPPORT", status: "SUSPENDED" },
    });

    await expect(
      bootstrapPlatformAdministrator(db, input(user.id)),
    ).rejects.toThrow();

    const staff = await db.platformStaff.findUniqueOrThrow({
      where: { userId: user.id },
    });
    expect(staff.role).toBe("SUPPORT");
    expect(staff.status).toBe("SUSPENDED");
    expect(await db.platformAuditLog.count()).toBe(0);
  });

  it("rejects a missing account", async () => {
    await expect(
      bootstrapPlatformAdministrator(db, input(randomUUID())),
    ).rejects.toThrow();
    expect(await db.platformStaff.count()).toBe(0);
    expect(await db.platformAdministrationControl.count()).toBe(0);
  });

  it("rolls back membership and control if audit fails, then permits retry", async () => {
    const user = await eligibleUser();

    await db.$executeRawUnsafe(
      'ALTER TABLE "PlatformAuditLog" ADD CONSTRAINT "bootstrap_test_audit_failure" ' +
      'CHECK ("requestId" <> \'bootstrap-audit-failure\')',
    );

    try {
      await expect(
        bootstrapPlatformAdministrator(
          db, input(user.id, "bootstrap-audit-failure"),
        ),
      ).rejects.toThrow();

      expect(await db.platformStaff.count()).toBe(0);
      expect(await db.platformAuditLog.count()).toBe(0);
      expect(await db.platformAdministrationControl.count()).toBe(0);
    } finally {
      await db.$executeRawUnsafe(
        'ALTER TABLE "PlatformAuditLog" DROP CONSTRAINT "bootstrap_test_audit_failure"',
      );
    }

    await expect(
      bootstrapPlatformAdministrator(db, input(user.id)),
    ).resolves.toHaveProperty("staffId");
  });
});
