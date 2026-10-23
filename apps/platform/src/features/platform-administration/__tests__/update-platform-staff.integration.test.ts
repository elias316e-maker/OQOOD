import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import {
  afterAll, beforeAll, beforeEach, describe, expect, it,
} from "vitest";

import { factorFingerprint } from "../factor-fingerprint";
import { updatePlatformStaff } from "../update-platform-staff";
import { createPlatformStaff } from "../create-platform-staff";
import type { PlatformRole } from "../permissions";

const connectionString = process.env.ADMIN_STAFF_TEST_DATABASE_URL;

describe.skipIf(!connectionString)("platform staff mutations", () => {
  let db: PrismaClient;

  beforeAll(() => {
    const url = new URL(connectionString!);
    if (
      !["127.0.0.1", "localhost"].includes(url.hostname) ||
      url.pathname !== "/oqood_admin_staff_test"
    ) {
      throw new Error("A dedicated local staff test database is required.");
    }
    db = new PrismaClient({
      adapter: new PrismaPg({ connectionString: connectionString! }),
    });
  });

  beforeEach(async () => {
    await db.platformSessionAssurance.deleteMany();
    await db.platformAuditLog.deleteMany();
    await db.platformStaff.deleteMany();
    await db.platformAdministrationControl.deleteMany();
    await db.platformAdministrationControl.create({
      data: {
        id: "platform-administration",
        bootstrappedAt: new Date(),
      },
    });
  });

  afterAll(async () => { await db?.$disconnect(); });

  async function fixture(role: PlatformRole = "PLATFORM_ADMIN") {
    const user = await db.user.create({
      data: {
        name: "Staff test fixture",
        email: `${randomUUID()}@example.invalid`,
        isActive: true,
        emailVerified: true,
        twoFactorEnabled: true,
      },
    });
    const staff = await db.platformStaff.create({
      data: { userId: user.id, role, status: "ACTIVE" },
    });
    const factor = await db.twoFactor.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        secret: "isolated-staff-test-factor",
        backupCodes: "isolated-test-only",
        verified: true,
      },
    });
    const now = new Date();
    const session = await db.session.create({
      data: {
        id: randomUUID(),
        token: randomUUID(),
        userId: user.id,
        updatedAt: now,
        expiresAt: new Date(now.getTime() + 3_600_000),
      },
    });
    await db.platformSessionAssurance.create({
      data: {
        sessionId: session.id,
        staffId: staff.id,
        factorId: factor.id,
        factorVersion: factorFingerprint(factor.id, factor.secret),
        authorizationVersion: 1,
        verifiedAt: now,
        expiresAt: new Date(now.getTime() + 900_000),
      },
    });
    return { user, staff, factor, session };
  }

  type Fixture = Awaited<ReturnType<typeof fixture>>;

  function input(actor: Fixture, target: Fixture) {
    return {
      actorUserId: actor.user.id,
      actorSessionId: actor.session.id,
      targetStaffId: target.staff.id,
      expectedAuthorizationVersion: 1,
      role: target.staff.role as PlatformRole,
      status: "SUSPENDED" as const,
      requestId: randomUUID(),
    };
  }

  it("updates membership, increments version, revokes proofs and audits", async () => {
    const actor = await fixture();
    const target = await fixture("SUPPORT");
    const request = input(actor, target);
    const result = await updatePlatformStaff(db, request);

    expect(result.authorizationVersion).toBe(2);
    const member = await db.platformStaff.findUniqueOrThrow({
      where: { id: target.staff.id },
    });
    expect(member.status).toBe("SUSPENDED");
    expect(await db.platformSessionAssurance.count({
      where: { staffId: target.staff.id },
    })).toBe(0);
    expect(await db.platformSessionAssurance.count({
      where: { staffId: actor.staff.id },
    })).toBe(1);

    const audit = await db.platformAuditLog.findFirstOrThrow({
      where: { requestId: request.requestId },
    });
    expect(audit.actorStaffId).toBe(actor.staff.id);
    expect(audit.targetId).toBe(target.staff.id);
    expect(audit.metadata).toMatchObject({
      before: { status: "ACTIVE", authorizationVersion: 1 },
      after: { status: "SUSPENDED", authorizationVersion: 2 },
    });
  });

  it("denies suspension or demotion of the last administrator", async () => {
    const actor = await fixture();
    await expect(
      updatePlatformStaff(db, input(actor, actor)),
    ).rejects.toThrow();
    await expect(updatePlatformStaff(db, {
      ...input(actor, actor), role: "SUPPORT", status: "ACTIVE",
    })).rejects.toThrow();
    expect(await db.platformAuditLog.count()).toBe(0);
  });

  it("permits exactly one concurrent self-demotion of two administrators", async () => {
    const first = await fixture();
    const second = await fixture();
    const results = await Promise.allSettled(
      [first, second].map((actor) => updatePlatformStaff(db, {
        ...input(actor, actor),
        role: "SUPPORT",
        status: "ACTIVE",
      })),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);
    expect(await db.platformStaff.count({
      where: { role: "PLATFORM_ADMIN", status: "ACTIVE" },
    })).toBe(1);
    expect(await db.platformAuditLog.count()).toBe(1);
  });

  it("denies mutation by support staff", async () => {
    const actor = await fixture("SUPPORT");
    const target = await fixture();
    await expect(
      updatePlatformStaff(db, input(actor, target)),
    ).rejects.toThrow();
  });

  it("denies sensitive mutations after five minutes", async () => {
    const actor = await fixture();
    const target = await fixture("SUPPORT");
    const verifiedAt = new Date(Date.now() - 360_000);
    await db.platformSessionAssurance.update({
      where: { sessionId: actor.session.id },
      data: {
        verifiedAt,
        expiresAt: new Date(verifiedAt.getTime() + 900_000),
      },
    });
    await expect(
      updatePlatformStaff(db, input(actor, target)),
    ).rejects.toThrow();
  });

  it("denies a forged actor identity and stale target version", async () => {
    const actor = await fixture();
    const target = await fixture("SUPPORT");
    await expect(updatePlatformStaff(db, {
      ...input(actor, target), actorUserId: target.user.id,
    })).rejects.toThrow();
    await expect(updatePlatformStaff(db, {
      ...input(actor, target), expectedAuthorizationVersion: 2,
    })).rejects.toThrow();
    expect(await db.platformAuditLog.count()).toBe(0);
  });

  it("does not count an unverified administrator as a replacement", async () => {
    const actor = await fixture();
    const other = await fixture();
    await db.user.update({
      where: { id: other.user.id }, data: { emailVerified: false },
    });
    await expect(
      updatePlatformStaff(db, input(actor, actor)),
    ).rejects.toThrow();
  });

  it("rolls back membership and proof revocation when auditing fails", async () => {
    const actor = await fixture();
    const target = await fixture("SUPPORT");
    await db.$executeRawUnsafe(
      'ALTER TABLE "PlatformAuditLog" ADD CONSTRAINT "staff_test_audit_failure" ' +
      'CHECK ("requestId" <> \'staff-audit-failure\')',
    );
    try {
      await expect(updatePlatformStaff(db, {
        ...input(actor, target), requestId: "staff-audit-failure",
      })).rejects.toThrow();

      const member = await db.platformStaff.findUniqueOrThrow({
        where: { id: target.staff.id },
      });
      expect(member.status).toBe("ACTIVE");
      expect(member.authorizationVersion).toBe(1);
      expect(await db.platformSessionAssurance.count({
        where: { staffId: target.staff.id },
      })).toBe(1);
      expect(await db.platformAuditLog.count()).toBe(0);
    } finally {
      await db.$executeRawUnsafe(
        'ALTER TABLE "PlatformAuditLog" DROP CONSTRAINT "staff_test_audit_failure"',
      );
    }
  });

  async function candidate() {
    const target = await fixture("SUPPORT");
    await db.platformSessionAssurance.deleteMany({
      where: { staffId: target.staff.id },
    });
    await db.platformStaff.delete({ where: { id: target.staff.id } });
    return target;
  }

  function creationInput(actor: Fixture, target: Fixture) {
    return {
      actorUserId: actor.user.id,
      actorSessionId: actor.session.id,
      targetUserId: target.user.id,
      role: "SUPPORT" as const,
      requestId: randomUUID(),
    };
  }

  it("creates a suspended membership and an audit without granting assurance", async () => {
    const actor = await fixture();
    const target = await candidate();
    const request = creationInput(actor, target);
    const result = await createPlatformStaff(db, request);

    const member = await db.platformStaff.findUniqueOrThrow({
      where: { id: result.staffId },
    });
    expect(member.userId).toBe(target.user.id);
    expect(member.role).toBe("SUPPORT");
    expect(member.status).toBe("SUSPENDED");
    expect(member.authorizationVersion).toBe(1);
    expect(await db.platformSessionAssurance.count({
      where: { staffId: member.id },
    })).toBe(0);

    const audit = await db.platformAuditLog.findFirstOrThrow({
      where: { requestId: request.requestId },
    });
    expect(audit.action).toBe("platform.staff.create");
    expect(audit.actorStaffId).toBe(actor.staff.id);
    expect(audit.targetId).toBe(member.id);
    expect(audit.metadata).toMatchObject({
      targetUserId: target.user.id,
      role: "SUPPORT",
      status: "SUSPENDED",
    });
  });

  it("rejects duplicate membership creation", async () => {
    const actor = await fixture();
    const target = await candidate();
    await createPlatformStaff(db, creationInput(actor, target));
    await expect(
      createPlatformStaff(db, creationInput(actor, target)),
    ).rejects.toThrow();

    expect(await db.platformStaff.count({
      where: { userId: target.user.id },
    })).toBe(1);
    expect(await db.platformAuditLog.count({
      where: { action: "platform.staff.create" },
    })).toBe(1);
  });

  it("accepts exactly one concurrent creation for the same account", async () => {
    const actor = await fixture();
    const target = await candidate();
    const results = await Promise.allSettled([
      createPlatformStaff(db, creationInput(actor, target)),
      createPlatformStaff(db, creationInput(actor, target)),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);
    expect(await db.platformStaff.count({
      where: { userId: target.user.id },
    })).toBe(1);
  });

  it("rejects creation by a support member", async () => {
    await fixture();
    const actor = await fixture("SUPPORT");
    const target = await candidate();
    await expect(
      createPlatformStaff(db, creationInput(actor, target)),
    ).rejects.toThrow();
    expect(await db.platformStaff.count({
      where: { userId: target.user.id },
    })).toBe(0);
  });

  it("rejects an unverified candidate account", async () => {
    const actor = await fixture();
    const target = await candidate();
    await db.user.update({
      where: { id: target.user.id },
      data: { emailVerified: false },
    });
    await expect(
      createPlatformStaff(db, creationInput(actor, target)),
    ).rejects.toThrow();
    expect(await db.platformStaff.count({
      where: { userId: target.user.id },
    })).toBe(0);
  });

  it("rolls back new membership when its audit fails", async () => {
    const actor = await fixture();
    const target = await candidate();

    await db.$executeRawUnsafe(
      'ALTER TABLE "PlatformAuditLog" ADD CONSTRAINT "staff_create_test_failure" ' +
      'CHECK ("requestId" <> \'staff-create-audit-failure\')',
    );
    try {
      await expect(createPlatformStaff(db, {
        ...creationInput(actor, target),
        requestId: "staff-create-audit-failure",
      })).rejects.toThrow();
      expect(await db.platformStaff.count({
        where: { userId: target.user.id },
      })).toBe(0);
      expect(await db.platformAuditLog.count()).toBe(0);
    } finally {
      await db.$executeRawUnsafe(
        'ALTER TABLE "PlatformAuditLog" DROP CONSTRAINT "staff_create_test_failure"',
      );
    }

    await expect(
      createPlatformStaff(db, creationInput(actor, target)),
    ).resolves.toHaveProperty("staffId");
  });

});
