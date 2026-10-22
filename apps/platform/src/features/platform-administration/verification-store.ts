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
 * No expired claim is reused here. Cleanup remains disabled until
 * retention is validated against the complete provider acceptance window.
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
      (${key}, CURRENT_TIMESTAMP + INTERVAL '15 minutes', CURRENT_TIMESTAMP)
    ON CONFLICT ("key") DO NOTHING
    RETURNING "key"
  `;

  if (accepted.length !== 1) {
    throw new PlatformVerificationReplayError();
  }
}
