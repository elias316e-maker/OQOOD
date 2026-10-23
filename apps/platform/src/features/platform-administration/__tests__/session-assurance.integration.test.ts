import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import {
  establishPlatformSessionAssurance,
  PlatformVerificationDeniedError,
} from "../establish-session-assurance";

const connectionString = process.env.ADMIN_TEST_DATABASE_URL;
const suite = connectionString ? describe : describe.skip;

// Provider callbacks are controlled fixtures. These tests exercise the
// real PostgreSQL transaction, not the Better Auth HTTP adapter.
suite("Administrative session assurance transactions", () => {
  let db: PrismaClient;

  beforeAll(() => {
    if (!connectionString) throw new Error("Missing isolated database.");
    const url = new URL(connectionString);
    if (
      !["127.0.0.1", "localhost"].includes(url.hostname) ||
      url.pathname !== "/oqood_admin_test"
    ) throw new Error("Only the dedicated local test database is allowed.");

    db = new PrismaClient({
      adapter: new PrismaPg({ connectionString }),
    });
  });

  afterAll(async () => { await db?.$disconnect(); });

  async function fixture() {
    const id = randomUUID();
    const user = await db.user.create({
      data: {
        name: "Administrative test fixture",
        email: `${id}@example.test`,
        isActive: true,
        emailVerified: true,
        twoFactorEnabled: true,
      },
    });
    const staff = await db.platformStaff.create({
      data: { userId: user.id, status: "ACTIVE", role: "PLATFORM_ADMIN" },
    });
    const factor = await db.twoFactor.create({
      data: {
        id: randomUUID(), userId: user.id, verified: true,
        secret: "isolated-encrypted-secret-fixture",
        backupCodes: "isolated-backup-fixture",
      },
    });
    const session = await db.session.create({
      data: {
        id: randomUUID(), token: randomUUID(), userId: user.id,
        expiresAt: new Date(Date.now() + 60 * 60_000),
        updatedAt: new Date(),
      },
    });
    return {
      staff, factor, session,
      input: {
        userId: user.id, sessionId: session.id, code: "123456",
        trustedSource: id, requestId: randomUUID(),
      },
    };
  }

  it("persists assurance and audit together", async () => {
    const { input, staff, factor } = await fixture();
    const result = await establishPlatformSessionAssurance(db, input, async () => true);
    const assurance = await db.platformSessionAssurance.findUniqueOrThrow({
      where: { sessionId: input.sessionId },
    });
    expect(assurance.staffId).toBe(staff.id);
    expect(assurance.factorId).toBe(factor.id);
    expect(assurance.expiresAt).toEqual(result.expiresAt);
    expect(assurance.expiresAt.getTime() - assurance.verifiedAt.getTime())
      .toBeLessThanOrEqual(15 * 60_000);
    const audit = await db.platformAuditLog.findFirstOrThrow({
      where: { requestId: input.requestId },
    });
    expect(audit.actorStaffId).toBe(staff.id);
    expect(audit.metadata).toEqual({ method: "TOTP" });
  });

  it("retains attempt charges after provider rejection", async () => {
    const { input } = await fixture();
    const before = await db.platformVerificationThrottle.aggregate({
      _sum: { attempts: true },
    });
    await expect(establishPlatformSessionAssurance(
      db, input, async () => false,
    )).rejects.toBeInstanceOf(PlatformVerificationDeniedError);
    const after = await db.platformVerificationThrottle.aggregate({
      _sum: { attempts: true },
    });
    expect(after._sum.attempts).toBe((before._sum.attempts ?? 0) + 2);
    expect(await db.platformSessionAssurance.count({
      where: { sessionId: input.sessionId },
    })).toBe(0);
  });

  it("rejects membership suspension during provider verification", async () => {
    const { input, staff } = await fixture();
    await expect(establishPlatformSessionAssurance(db, input, async () => {
      await db.platformStaff.update({
        where: { id: staff.id }, data: { status: "SUSPENDED" },
      });
      return true;
    })).rejects.toBeInstanceOf(PlatformVerificationDeniedError);
    expect(await db.platformSessionAssurance.count({
      where: { sessionId: input.sessionId },
    })).toBe(0);
  });

  it("rejects factor replacement during provider verification", async () => {
    const { input, factor } = await fixture();
    await expect(establishPlatformSessionAssurance(db, input, async () => {
      await db.twoFactor.update({
        where: { id: factor.id }, data: { secret: "replaced-fixture-secret" },
      });
      return true;
    })).rejects.toBeInstanceOf(PlatformVerificationDeniedError);
    expect(await db.platformSessionAssurance.count({
      where: { sessionId: input.sessionId },
    })).toBe(0);
  });

  it("rejects a foreign session before calling the provider", async () => {
    const { input } = await fixture();
    const provider = vi.fn(async () => true);
    await expect(establishPlatformSessionAssurance(
      db, { ...input, userId: randomUUID() }, provider,
    )).rejects.toBeInstanceOf(PlatformVerificationDeniedError);
    expect(provider).not.toHaveBeenCalled();
  });

  it("rolls back assurance and replay claim when audit insertion fails", async () => {
    const { input } = await fixture();
    const replayBefore = await db.platformVerificationReplay.count();

    // Dedicated temporary database only. Force a genuine SQL failure.
    await db.$executeRawUnsafe(
      'ALTER TABLE "PlatformAuditLog" ADD CONSTRAINT "admin_test_audit_failure" CHECK ("requestId" <> \'injected-audit-failure\')',
    );
    try {
      await expect(establishPlatformSessionAssurance(
        db, { ...input, requestId: "injected-audit-failure" }, async () => true,
      )).rejects.toThrow();
      expect(await db.platformSessionAssurance.count({
        where: { sessionId: input.sessionId },
      })).toBe(0);
      expect(await db.platformVerificationReplay.count()).toBe(replayBefore);
      expect(await db.platformAuditLog.count({
        where: { requestId: "injected-audit-failure" },
      })).toBe(0);
    } finally {
      await db.$executeRawUnsafe(
        'ALTER TABLE "PlatformAuditLog" DROP CONSTRAINT "admin_test_audit_failure"',
      );
    }

    // Same code succeeds after rollback: its claim was not committed.
    await expect(establishPlatformSessionAssurance(
      db, input, async () => true,
    )).resolves.toHaveProperty("expiresAt");
  });

  it("rejects a locked factor before calling the provider", async () => {
    const { input, factor } = await fixture();
    await db.twoFactor.update({
      where: { id: factor.id },
      data: { lockedUntil: new Date(Date.now() + 60_000) },
    });
    const provider = vi.fn(async () => true);
    await expect(
      establishPlatformSessionAssurance(db, input, provider),
    ).rejects.toBeInstanceOf(PlatformVerificationDeniedError);
    expect(provider).not.toHaveBeenCalled();
    expect(await db.platformSessionAssurance.count({
      where: { sessionId: input.sessionId },
    })).toBe(0);
  });

  it("rejects a factor locked during provider verification", async () => {
    const { input, factor } = await fixture();
    await expect(establishPlatformSessionAssurance(db, input, async () => {
      await db.twoFactor.update({
        where: { id: factor.id },
        data: { lockedUntil: new Date(Date.now() + 60_000) },
      });
      return true;
    })).rejects.toBeInstanceOf(PlatformVerificationDeniedError);
    expect(await db.platformSessionAssurance.count({
      where: { sessionId: input.sessionId },
    })).toBe(0);
  });

});
