import type { PrismaClient } from "@/generated/prisma/client";
import type { PlatformRole } from "./permissions";
import { requireStaffMutationContext } from "./staff-mutation-context";

export class PlatformStaffCreationDeniedError extends Error {
  constructor() {
    super("تعذرت إضافة العضوية. تحقق من الحساب وأهليته وعدم وجود عضوية سابقة.");
    this.name = "PlatformStaffCreationDeniedError";
  }
}

type CreatePlatformStaffInput = {
  actorUserId: string;
  actorSessionId: string;
  targetUserId: string;
  role: PlatformRole;
  requestId: string;
};

/**
 * Internal service for an explicitly selected existing identity.
 * Never accept actor identity from browser-submitted fields.
 */
export async function createPlatformStaff(
  db: PrismaClient,
  input: CreatePlatformStaffInput,
): Promise<{ staffId: string }> {
  if (
    !input.actorUserId ||
    !input.actorSessionId ||
    !input.targetUserId ||
    input.targetUserId.length > 128 ||
    !input.requestId ||
    input.requestId.length > 128 ||
    !["PLATFORM_ADMIN", "SUPPORT", "BILLING", "AUDITOR"].includes(input.role)
  ) {
    throw new PlatformStaffCreationDeniedError();
  }

  return db.$transaction(async (tx) => {
    const { actor, session, now } = await requireStaffMutationContext(tx, input);

    await tx.$queryRaw`
      SELECT "id" FROM "User"
      WHERE "id" = ${input.targetUserId}
      FOR UPDATE
    `;
    await tx.$queryRaw`
      SELECT "id" FROM "TwoFactor"
      WHERE "userId" = ${input.targetUserId}
      ORDER BY "id" FOR UPDATE
    `;

    const user = await tx.user.findUnique({
      where: { id: input.targetUserId },
      select: {
        isActive: true,
        emailVerified: true,
        twoFactorEnabled: true,
        platformStaff: { select: { id: true } },
        twoFactors: {
          select: {
            verified: true,
            secret: true,
            lockedUntil: true,
          },
        },
      },
    });
    const factor = user?.twoFactors[0];

    if (
      !user ||
      user.platformStaff ||
      !user.isActive ||
      !user.emailVerified ||
      user.twoFactorEnabled !== true ||
      user.twoFactors.length !== 1 ||
      !factor?.verified ||
      !factor.secret ||
      (factor.lockedUntil !== null && factor.lockedUntil > now)
    ) {
      throw new PlatformStaffCreationDeniedError();
    }

    const member = await tx.platformStaff.create({
      data: {
        userId: input.targetUserId,
        role: input.role,
        status: "SUSPENDED",
        authorizationVersion: 1,
      },
      select: { id: true },
    });

    await tx.platformAuditLog.create({
      data: {
        actorUserId: session.userId,
        actorStaffId: actor.id,
        action: "platform.staff.create",
        targetType: "PlatformStaff",
        targetId: member.id,
        requestId: input.requestId,
        metadata: {
          targetUserId: input.targetUserId,
          role: input.role,
          status: "SUSPENDED",
          authorizationVersion: 1,
        },
      },
    });

    return { staffId: member.id };
  }, {
    isolationLevel: "ReadCommitted",
    maxWait: 10_000,
    timeout: 20_000,
  });
}
