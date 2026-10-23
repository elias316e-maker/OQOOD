import type { Prisma } from "@/generated/prisma/client";

import { canAccessPlatform } from "./access-policy";
import { factorFingerprint } from "./factor-fingerprint";
import { PlatformPermissions } from "./permissions";

export class PlatformStaffMutationAccessDeniedError extends Error {
  constructor() {
    super("يلزم وصول إداري صالح وتحقق حديث لإدارة الموظفين.");
    this.name = "PlatformStaffMutationAccessDeniedError";
  }
}

export async function requireStaffMutationContext(
  tx: Prisma.TransactionClient,
  input: { actorUserId: string; actorSessionId: string },
) {
    // Shared with bootstrap and future membership mutations.
    const control = await tx.$queryRaw<
      Array<{ bootstrappedAt: Date | null }>
    >`
      SELECT "bootstrappedAt"
      FROM "PlatformAdministrationControl"
      WHERE "id" = 'platform-administration'
      FOR UPDATE
    `;
    if (control.length !== 1 || !control[0].bootstrappedAt) {
      throw new PlatformStaffMutationAccessDeniedError();
    }

    // Stable lock ordering protects eligibility while this mutation runs.
    await tx.$queryRaw`
      SELECT "id" FROM "PlatformStaff" ORDER BY "id" FOR UPDATE
    `;
    await tx.$queryRaw`
      SELECT "id" FROM "User"
      WHERE "id" IN (SELECT "userId" FROM "PlatformStaff")
      ORDER BY "id" FOR UPDATE
    `;
    await tx.$queryRaw`
      SELECT "id" FROM "TwoFactor"
      WHERE "userId" IN (SELECT "userId" FROM "PlatformStaff")
      ORDER BY "id" FOR UPDATE
    `;
    await tx.$queryRaw`
      SELECT "id" FROM "Session"
      WHERE "id" = ${input.actorSessionId}
      FOR UPDATE
    `;
    await tx.$queryRaw`
      SELECT "id" FROM "PlatformSessionAssurance"
      WHERE "sessionId" = ${input.actorSessionId}
      FOR UPDATE
    `;

    const session = await tx.session.findUnique({
      where: { id: input.actorSessionId },
      include: {
        user: { include: { platformStaff: true } },
        platformAssurance: { include: { factor: true } },
      },
    });
    const actor = session?.user.platformStaff;
    const assurance = session?.platformAssurance;

    if (
      !session ||
      session.userId !== input.actorUserId ||
      !actor ||
      !assurance
    ) {
      throw new PlatformStaffMutationAccessDeniedError();
    }

    const now = new Date();
    const authorized = canAccessPlatform({
      user: {
        id: session.user.id,
        isActive: session.user.isActive,
        emailVerified: session.user.emailVerified,
        twoFactorEnabled: session.user.twoFactorEnabled === true,
      },
      session,
      staff: actor,
      factor: {
        id: assurance.factor.id,
        userId: assurance.factor.userId,
        verified: assurance.factor.verified,
        version: factorFingerprint(
          assurance.factor.id, assurance.factor.secret,
        ),
      },
      assurance,
    }, PlatformPermissions.staffManage, now, true);

    if (!authorized) {
      throw new PlatformStaffMutationAccessDeniedError();
    }

    return { actor, session, now };
}
