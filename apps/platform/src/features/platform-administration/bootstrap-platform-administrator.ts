import type { PrismaClient } from "@/generated/prisma/client";

export class PlatformBootstrapDeniedError extends Error {
  constructor() {
    super("تعذر تهيئة مدير المنصة. تحقق من أهلية الحساب وحالة التهيئة.");
    this.name = "PlatformBootstrapDeniedError";
  }
}

type BootstrapPlatformAdministratorInput = {
  userId: string;
  operatorReference: string;
  requestId: string;
};

/**
 * Internal provisioning service. Do not expose as a public action or route.
 * The operator reference identifies the authorized provisioning operator;
 * the target user is not recorded as having performed the operation.
 */
export async function bootstrapPlatformAdministrator(
  db: PrismaClient,
  input: BootstrapPlatformAdministratorInput,
): Promise<{ staffId: string }> {
  if (
    !input.userId.trim() ||
    input.userId.length > 128 ||
    !input.operatorReference.trim() ||
    input.operatorReference.length > 200 ||
    !input.requestId.trim() ||
    input.requestId.length > 128
  ) {
    throw new PlatformBootstrapDeniedError();
  }

  return db.$transaction(async (tx) => {
    // All bootstrap attempts lock the same durable row before checking
    // membership. A concurrent attempt observes the committed result.
    await tx.$executeRaw`
      INSERT INTO "PlatformAdministrationControl"
        ("id", "createdAt", "updatedAt")
      VALUES
        ('platform-administration', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT ("id") DO NOTHING
    `;

    const controls = await tx.$queryRaw<
      Array<{ bootstrappedAt: Date | null }>
    >`
      SELECT "bootstrappedAt"
      FROM "PlatformAdministrationControl"
      WHERE "id" = 'platform-administration'
      FOR UPDATE
    `;

    if (controls.length !== 1 || controls[0].bootstrappedAt !== null) {
      throw new PlatformBootstrapDeniedError();
    }

    // Existing staff require a separate recovery or management process.
    // Bootstrap must not reactivate or promote existing memberships.
    const existingStaff = await tx.platformStaff.count();
    if (existingStaff !== 0) {
      throw new PlatformBootstrapDeniedError();
    }

    // Lock the identity and its factors while evaluating eligibility.
    await tx.$queryRaw`
      SELECT "id" FROM "User"
      WHERE "id" = ${input.userId}
      FOR UPDATE
    `;

    await tx.$queryRaw`
      SELECT "id" FROM "TwoFactor"
      WHERE "userId" = ${input.userId}
      ORDER BY "id"
      FOR UPDATE
    `;

    const user = await tx.user.findUnique({
      where: { id: input.userId },
      select: {
        isActive: true,
        emailVerified: true,
        twoFactorEnabled: true,
        twoFactors: {
          select: {
            verified: true,
            secret: true,
            lockedUntil: true,
          },
        },
      },
    });

    const now = new Date();
    const factor = user?.twoFactors[0];

    if (
      !user ||
      !user.isActive ||
      !user.emailVerified ||
      user.twoFactorEnabled !== true ||
      user.twoFactors.length !== 1 ||
      !factor?.verified ||
      !factor.secret ||
      (factor.lockedUntil !== null && factor.lockedUntil > now)
    ) {
      throw new PlatformBootstrapDeniedError();
    }

    const staff = await tx.platformStaff.create({
      data: {
        userId: input.userId,
        role: "PLATFORM_ADMIN",
        status: "ACTIVE",
        authorizationVersion: 1,
      },
      select: { id: true },
    });

    await tx.platformAuditLog.create({
      data: {
        actorUserId: "system:platform-bootstrap",
        action: "platform.staff.bootstrap",
        targetType: "PlatformStaff",
        targetId: staff.id,
        requestId: input.requestId,
        metadata: {
          operatorReference: input.operatorReference.trim(),
          targetUserId: input.userId,
          role: "PLATFORM_ADMIN",
        },
      },
    });

    await tx.platformAdministrationControl.update({
      where: { id: "platform-administration" },
      data: { bootstrappedAt: now },
    });

    // Provisioning grants membership only. Administrative session
    // assurance still requires the normal server-side TOTP flow.
    return { staffId: staff.id };
  }, {
    isolationLevel: "ReadCommitted",
    maxWait: 10_000,
    timeout: 20_000,
  });
}
