import type { Prisma, PrismaClient } from "@/generated/prisma/client";

import { factorFingerprint } from "./factor-fingerprint";
import { platformRoleHasPermission, PlatformPermissions } from "./permissions";
import {
  claimPlatformVerificationCode,
  prunePlatformVerificationState,
  reservePlatformVerificationAttempt,
} from "./verification-store";

export class PlatformVerificationDeniedError extends Error {
  constructor() {
    super("تعذر اعتماد التحقق الإداري.");
    this.name = "PlatformVerificationDeniedError";
  }
}

type VerificationInput = {
  userId: string;
  sessionId: string;
  code: string;
  trustedSource: string;
  requestId: string;
};

async function eligibleSession(
  db: PrismaClient | Prisma.TransactionClient,
  input: VerificationInput,
) {
  const session = await db.session.findUnique({
    where: { id: input.sessionId },
    include: {
      user: {
        include: {
          platformStaff: true,
          twoFactors: true,
        },
      },
    },
  });

  const staff = session?.user.platformStaff;
  const factors = session?.user.twoFactors ?? [];
  const factor = factors[0];

  if (
    !session ||
    session.userId !== input.userId ||
    !session.user.isActive ||
    !session.user.emailVerified ||
    session.user.twoFactorEnabled !== true ||
    session.expiresAt.getTime() <= Date.now() ||
    !staff ||
    staff.status !== "ACTIVE" ||
    !platformRoleHasPermission(staff.role, PlatformPermissions.portalAccess) ||
    factors.length !== 1 ||
    !factor ||
    !factor.verified
  ) {
    throw new PlatformVerificationDeniedError();
  }

  return {
    sessionId: session.id,
    userId: session.userId,
    sessionExpiresAt: session.expiresAt,
    staffId: staff.id,
    authorizationVersion: staff.authorizationVersion,
    factorId: factor.id,
    factorVersion: factorFingerprint(factor.id, factor.secret),
  };
}

/**
 * Internal application service. The provider callback must verify the
 * supplied code against the authenticated session represented by input.
 * Never expose this function directly as a client-callable action.
 */
export async function establishPlatformSessionAssurance(
  db: PrismaClient,
  input: VerificationInput,
  verifyWithProvider: () => Promise<boolean>,
): Promise<{ expiresAt: Date }> {
  if (
    !input.userId ||
    !input.sessionId ||
    !/^[0-9]{6}$/.test(input.code) ||
    !input.trustedSource ||
    !input.requestId ||
    input.requestId.length > 128
  ) {
    throw new PlatformVerificationDeniedError();
  }

  const original = await eligibleSession(db, input);
  await prunePlatformVerificationState(db);

  // Committed separately: provider failure must not refund the attempt.
  await reservePlatformVerificationAttempt(
    db, input.userId, input.trustedSource,
  );

  const providerStarted = performance.now();
  const providerAccepted = await verifyWithProvider();
  if (!providerAccepted || performance.now() - providerStarted > 30_000) {
    throw new PlatformVerificationDeniedError();
  }

  return db.$transaction(async (tx) => {
    const current = await eligibleSession(tx, input);

    if (
      current.staffId !== original.staffId ||
      current.authorizationVersion !== original.authorizationVersion ||
      current.factorId !== original.factorId ||
      current.factorVersion !== original.factorVersion
    ) {
      throw new PlatformVerificationDeniedError();
    }

    const verifiedAt = new Date();
    const expiresAt = new Date(Math.min(
      verifiedAt.getTime() + 15 * 60_000,
      current.sessionExpiresAt.getTime(),
    ));
    if (expiresAt <= verifiedAt) {
      throw new PlatformVerificationDeniedError();
    }

    await claimPlatformVerificationCode(
      tx, current.factorVersion, input.code,
    );

    const assurance = {
      staffId: current.staffId,
      factorId: current.factorId,
      factorVersion: current.factorVersion,
      authorizationVersion: current.authorizationVersion,
      verifiedAt,
      expiresAt,
    };

    await tx.platformSessionAssurance.upsert({
      where: { sessionId: current.sessionId },
      create: { sessionId: current.sessionId, ...assurance },
      update: assurance,
    });

    await tx.platformAuditLog.create({
      data: {
        actorUserId: current.userId,
        actorStaffId: current.staffId,
        action: "platform.session.verify",
        targetType: "PlatformSessionAssurance",
        targetId: current.sessionId,
        requestId: input.requestId,
        metadata: { method: "TOTP" },
      },
    });

    return { expiresAt };
  }, {
    isolationLevel: "Serializable",
    maxWait: 5_000,
    timeout: 10_000,
  });
}
