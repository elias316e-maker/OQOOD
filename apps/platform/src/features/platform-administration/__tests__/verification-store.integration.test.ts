import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  claimPlatformVerificationCode,
  prunePlatformVerificationState,
  reservePlatformVerificationAttempt,
  PlatformVerificationRateLimitError,
  PlatformVerificationReplayError,
} from "../verification-store";

const connectionString = process.env.ADMIN_TEST_DATABASE_URL;
const suite = connectionString ? describe : describe.skip;

suite("Administrative verification PostgreSQL concurrency", () => {
  let db: PrismaClient;

  beforeAll(() => {
    if (!connectionString) throw new Error("Missing isolated database.");
    const url = new URL(connectionString);
    if (
      !["127.0.0.1", "localhost"].includes(url.hostname) ||
      url.pathname !== "/oqood_admin_test"
    ) {
      throw new Error("Only the dedicated local test database is allowed.");
    }
    db = new PrismaClient({
      adapter: new PrismaPg({ connectionString }),
    });
  });

  afterAll(async () => {
    await db?.$disconnect();
  });

  it("accepts exactly five concurrent attempts for one account", async () => {
    const account = randomUUID();
    const results = await Promise.allSettled(
      Array.from({ length: 12 }, (_, i) =>
        reservePlatformVerificationAttempt(db, account, randomUUID() + i),
      ),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(5);
    for (const result of results) {
      if (result.status === "rejected") {
        expect(result.reason).toBeInstanceOf(PlatformVerificationRateLimitError);
      }
    }
  });

  it("limits a shared source across different accounts", async () => {
    const source = randomUUID();
    const results = await Promise.allSettled(
      Array.from({ length: 35 }, () =>
        reservePlatformVerificationAttempt(db, randomUUID(), source),
      ),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(30);
    for (const result of results) {
      if (result.status === "rejected") {
        expect(result.reason).toBeInstanceOf(PlatformVerificationRateLimitError);
      }
    }
  });

  it("rolls back both counter reservations when one limit rejects", async () => {
    const account = randomUUID();
    for (let i = 0; i < 5; i++) {
      await reservePlatformVerificationAttempt(db, account, randomUUID());
    }
    const before = await db.platformVerificationThrottle.findMany({
      orderBy: { key: "asc" },
    });
    await expect(
      reservePlatformVerificationAttempt(db, account, randomUUID()),
    ).rejects.toBeInstanceOf(PlatformVerificationRateLimitError);
    const after = await db.platformVerificationThrottle.findMany({
      orderBy: { key: "asc" },
    });
    expect(after).toEqual(before);
  });

  it("allows only one concurrent claim for the same factor and code", async () => {
    const factor = randomUUID();
    const results = await Promise.allSettled(
      Array.from({ length: 8 }, () =>
        db.$transaction((tx) =>
          claimPlatformVerificationCode(tx, factor, "123456"),
        ),
      ),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    for (const result of results) {
      if (result.status === "rejected") {
        expect(result.reason).toBeInstanceOf(PlatformVerificationReplayError);
      }
    }
  });

  it("rolls back a code claim when the enclosing transaction fails", async () => {
    const factor = randomUUID();
    await expect(db.$transaction(async (tx) => {
      await claimPlatformVerificationCode(tx, factor, "234567");
      throw new Error("Injected transaction failure");
    })).rejects.toThrow("Injected transaction failure");

    await expect(db.$transaction((tx) =>
      claimPlatformVerificationCode(tx, factor, "234567"),
    )).resolves.toBeUndefined();
  });

  it("does not confuse identical codes from different factors", async () => {
    for (let i = 0; i < 2; i++) {
      await expect(db.$transaction((tx) =>
        claimPlatformVerificationCode(tx, randomUUID(), "345678"),
      )).resolves.toBeUndefined();
    }
  });

  it("replaces an old expired claim exactly once under concurrency", async () => {
    const factor = randomUUID();
    const before = new Set(
      (await db.platformVerificationReplay.findMany()).map((row) => row.key),
    );
    await db.$transaction((tx) =>
      claimPlatformVerificationCode(tx, factor, "456789"),
    );
    const claim = (await db.platformVerificationReplay.findMany())
      .find((row) => !before.has(row.key));
    if (!claim) throw new Error("Missing claim fixture.");

    await db.platformVerificationReplay.update({
      where: { key: claim.key },
      data: {
        createdAt: new Date(Date.now() - 16 * 60_000),
        expiresAt: new Date(Date.now() - 60_000),
      },
    });

    const results = await Promise.allSettled(
      Array.from({ length: 8 }, () =>
        db.$transaction((tx) =>
          claimPlatformVerificationCode(tx, factor, "456789"),
        ),
      ),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((r) => r.status === "rejected")).toHaveLength(7);
  });

  it("does not replace a recently created claim even if its expiry is past", async () => {
    const factor = randomUUID();
    const before = new Set(
      (await db.platformVerificationReplay.findMany()).map((row) => row.key),
    );
    await db.$transaction((tx) =>
      claimPlatformVerificationCode(tx, factor, "567890"),
    );
    const claim = (await db.platformVerificationReplay.findMany())
      .find((row) => !before.has(row.key));
    if (!claim) throw new Error("Missing claim fixture.");

    await db.platformVerificationReplay.update({
      where: { key: claim.key },
      data: { expiresAt: new Date(Date.now() - 1_000) },
    });
    await prunePlatformVerificationState(db);
    expect(await db.platformVerificationReplay.findUnique({
      where: { key: claim.key },
    })).not.toBeNull();

    await expect(db.$transaction((tx) =>
      claimPlatformVerificationCode(tx, factor, "567890"),
    )).rejects.toBeInstanceOf(PlatformVerificationReplayError);
  });

  it("cleans old state while retaining live claims and blocked counters", async () => {
    const old = new Date(Date.now() - 20 * 60_000);
    const future = new Date(Date.now() + 20 * 60_000);
    const expiredKey = randomUUID();
    const liveKey = randomUUID();
    const expiredCounter = randomUUID();
    const blockedCounter = randomUUID();

    await db.platformVerificationReplay.createMany({
      data: [
        { key: expiredKey, createdAt: old, expiresAt: old },
        { key: liveKey, createdAt: new Date(), expiresAt: future },
      ],
    });
    await db.platformVerificationThrottle.createMany({
      data: [
        {
          key: expiredCounter, attempts: 5,
          windowStartAt: old, expiresAt: old,
        },
        {
          key: blockedCounter, attempts: 5,
          windowStartAt: old, expiresAt: old, blockedUntil: future,
        },
      ],
    });

    await prunePlatformVerificationState(db);

    expect(await db.platformVerificationReplay.findUnique({
      where: { key: expiredKey },
    })).toBeNull();
    expect(await db.platformVerificationReplay.findUnique({
      where: { key: liveKey },
    })).not.toBeNull();
    expect(await db.platformVerificationThrottle.findUnique({
      where: { key: expiredCounter },
    })).toBeNull();
    expect(await db.platformVerificationThrottle.findUnique({
      where: { key: blockedCounter },
    })).not.toBeNull();
  });

});
