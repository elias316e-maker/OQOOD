import { factorFingerprint } from "./factor-fingerprint";

import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session/get-current-session";

import { canAccessPlatform } from "./access-policy";
import type { PlatformPermission } from "./permissions";

export class PlatformAccessDeniedError extends Error {
  constructor() {
    super("ليس لديك وصول إداري صالح لتنفيذ هذا الإجراء.");
    this.name = "PlatformAccessDeniedError";
  }
}


export async function requirePlatformPermission(
  permission: PlatformPermission,
  sensitive = false,
) {
  const authenticated = await getCurrentSession();
  if (!authenticated?.session?.id || !authenticated.user?.id) {
    throw new PlatformAccessDeniedError();
  }

  // Re-read authoritative state. Do not authorize from cached user claims.
  const session = await prisma.session.findUnique({
    where: { id: authenticated.session.id },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      user: {
        select: {
          id: true,
          isActive: true,
          emailVerified: true,
          twoFactorEnabled: true,
          platformStaff: {
            select: {
              id: true,
              userId: true,
              status: true,
              role: true,
              authorizationVersion: true,
            },
          },
        },
      },
      platformAssurance: {
        select: {
          sessionId: true,
          staffId: true,
          factorId: true,
          factorVersion: true,
          authorizationVersion: true,
          verifiedAt: true,
          expiresAt: true,
          factor: {
            select: {
              id: true,
              userId: true,
              verified: true,
              secret: true,
            },
          },
        },
      },
    },
  });

  if (!session || session.userId !== authenticated.user.id) {
    throw new PlatformAccessDeniedError();
  }

  const staff = session.user.platformStaff;
  const assurance = session.platformAssurance;
  if (!staff || !assurance) {
    throw new PlatformAccessDeniedError();
  }

  const allowed = canAccessPlatform({
    user: {
      id: session.user.id,
      isActive: session.user.isActive,
      emailVerified: session.user.emailVerified,
      twoFactorEnabled: session.user.twoFactorEnabled === true,
    },
    session: {
      id: session.id,
      userId: session.userId,
      expiresAt: session.expiresAt,
    },
    staff,
    factor: {
      id: assurance.factor.id,
      userId: assurance.factor.userId,
      verified: assurance.factor.verified,
      version: factorFingerprint(
        assurance.factor.id,
        assurance.factor.secret,
      ),
    },
    assurance,
  }, permission, new Date(), sensitive);

  if (!allowed) throw new PlatformAccessDeniedError();

  // Return only the administrative context needed by application services.
  return {
    userId: session.user.id,
    staffId: staff.id,
    role: staff.role,
    sessionId: session.id,
    authorizationVersion: staff.authorizationVersion,
  };
}
