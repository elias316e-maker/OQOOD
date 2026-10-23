import { createHmac } from "node:crypto";

import type { Prisma, PrismaClient } from "@/generated/prisma/client";

export class PlatformVerificationRateLimitError extends Error {
  constructor() {
    super("تم تجاوز عدد محاولات التحقق المسموح.");
    this.name = "PlatformVerificationRateLimitError";
  }
}

export class PlatformVerificationReplayError extends Error {
  constructor() {
    super("لا يمكن إعادة استخدام رمز التحقق.");
    this.name = "PlatformVerificationReplayError";
  }
}

function digest(parts: string[]): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("Administrative verification requires an authentication secret.");
  }
  return createHmac("sha256", secret)
    .update(JSON.stringify(parts))
    .digest("hex");
}

/**
 * trustedSource must come from the deployment's trusted proxy policy,
 * never directly from an arbitrary client-supplied forwarding header.
 */
export async function reservePlatformVerificationAttempt(
  db: PrismaClient,
  userId: string,
  trustedSource: string,
): Promise<void> {
  if (!userId || !trustedSource) {
    throw new Error("Verification account and trusted request source are required.");
  }

  const limits = [
    {
      key: digest(["platform-verification-account-v1", userId]),
      maximum: 5,
    },
    {
      key: digest(["platform-verification-source-v1", trustedSource]),
      maximum: 30,
    },
  ].sort((a, b) => a.key.localeCompare(b.key));

  // Fixed windows, counted before provider verification. Successful
  // checks do not reset counters. Both reservations commit or roll back.
  await db.$transaction(async (tx) => {
    for (const limit of limits) {
      const accepted = await tx.$queryRaw<Array<{ key: string }>>`
        INSERT INTO "PlatformVerificationThrottle"
          ("key", "attempts", "windowStartAt", "blockedUntil",
           "expiresAt", "updatedAt")
        VALUES
          (${limit.key}, 1, CURRENT_TIMESTAMP, NULL,
           CURRENT_TIMESTAMP + INTERVAL '15 minutes', CURRENT_TIMESTAMP)
        ON CONFLICT ("key") DO UPDATE SET
          "attempts" = CASE
            WHEN "PlatformVerificationThrottle"."windowStartAt"
              <= CURRENT_TIMESTAMP - INTERVAL '15 minutes'
            THEN 1
            ELSE "PlatformVerificationThrottle"."attempts" + 1
          END,
          "windowStartAt" = CASE
            WHEN "PlatformVerificationThrottle"."windowStartAt"
              <= CURRENT_TIMESTAMP - INTERVAL '15 minutes'
            THEN CURRENT_TIMESTAMP
            ELSE "PlatformVerificationThrottle"."windowStartAt"
          END,
          "expiresAt" = CASE
            WHEN "PlatformVerificationThrottle"."windowStartAt"
              <= CURRENT_TIMESTAMP - INTERVAL '15 minutes'
            THEN CURRENT_TIMESTAMP + INTERVAL '15 minutes'
            ELSE "PlatformVerificationThrottle"."expiresAt"
          END,
          "updatedAt" = CURRENT_TIMESTAMP
        WHERE
          ("PlatformVerificationThrottle"."blockedUntil" IS NULL OR
           "PlatformVerificationThrottle"."blockedUntil" <= CURRENT_TIMESTAMP)
          AND (
            "PlatformVerificationThrottle"."windowStartAt"
              <= CURRENT_TIMESTAMP - INTERVAL '15 minutes'
            OR "PlatformVerificationThrottle"."attempts" < ${limit.maximum}
          )
        RETURNING "key"
      `;
      if (accepted.length !== 1) {
        throw new PlatformVerificationRateLimitError();
      }
    }
  });
}

/**
 * Call only after provider verification succeeds, inside the same
 * transaction that writes session assurance and its audit event.
 * The installed provider accepts adjacent 30-second periods.
 * Retain claims for 15 minutes, beyond its 90-second acceptance span.
 * Only sufficiently old, expired claims may be replaced atomically.
 */
export async function claimPlatformVerificationCode(
  tx: Prisma.TransactionClient,
  factorVersion: string,
  code: string,
): Promise<void> {
  if (!factorVersion || !/^[0-9]{6}$/.test(code)) {
    throw new Error("Invalid administrative verification input.");
  }

  const key = digest([
    "platform-verification-replay-v1",
    factorVersion,
    code,
  ]);

  const accepted = await tx.$queryRaw<Array<{ key: string }>>`
    INSERT INTO "PlatformVerificationReplay"
      ("key", "expiresAt", "createdAt")
    VALUES
      (${key}, statement_timestamp() + INTERVAL '15 minutes',
       statement_timestamp())
    ON CONFLICT ("key") DO UPDATE SET
      "expiresAt" = EXCLUDED."expiresAt",
      "createdAt" = EXCLUDED."createdAt"
    WHERE
      "PlatformVerificationReplay"."expiresAt" <= statement_timestamp()
      AND "PlatformVerificationReplay"."createdAt"
        <= statement_timestamp() - INTERVAL '15 minutes'
    RETURNING "key"
  `;

  if (accepted.length !== 1) {
    throw new PlatformVerificationReplayError();
  }
}

/**
 * Bounded maintenance of ephemeral verification state only.
 * Preserve live replay claims, active attempt windows and blocked counters.
 * SKIP LOCKED avoids waiting on concurrent verification transactions.
 */
export async function prunePlatformVerificationState(
  db: PrismaClient,
): Promise<void> {
  await db.$transaction(async (tx) => {
    await tx.$executeRaw`
      WITH expired AS (
        SELECT "key" FROM "PlatformVerificationReplay"
        WHERE "expiresAt" <= statement_timestamp()
          AND "createdAt" <= statement_timestamp() - INTERVAL '15 minutes'
        ORDER BY "expiresAt", "key"
        LIMIT 100
        FOR UPDATE SKIP LOCKED
      )
      DELETE FROM "PlatformVerificationReplay" AS state
      USING expired
      WHERE state."key" = expired."key"
    `;

    await tx.$executeRaw`
      WITH expired AS (
        SELECT "key" FROM "PlatformVerificationThrottle"
        WHERE "expiresAt" <= statement_timestamp()
          AND "windowStartAt" <= statement_timestamp() - INTERVAL '15 minutes'
          AND ("blockedUntil" IS NULL OR "blockedUntil" <= statement_timestamp())
        ORDER BY "expiresAt", "key"
        LIMIT 100
        FOR UPDATE SKIP LOCKED
      )
      DELETE FROM "PlatformVerificationThrottle" AS state
      USING expired
      WHERE state."key" = expired."key"
    `;
  });
}
