import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  claimPlatformVerificationCode,
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
});
