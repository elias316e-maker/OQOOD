import type { PrismaClient } from "@/generated/prisma/client";

import type { PlatformRole } from "./permissions";
import { requireStaffMutationContext } from "./staff-mutation-context";

export class PlatformStaffUpdateDeniedError extends Error {
  constructor() {
    super("تعذر تعديل العضوية الإدارية. تحقق من الصلاحية وحداثة البيانات.");
    this.name = "PlatformStaffUpdateDeniedError";
  }
}

type UpdatePlatformStaffInput = {
  actorUserId: string;
  actorSessionId: string;
  targetStaffId: string;
  expectedAuthorizationVersion: number;
  role: PlatformRole;
  status: "ACTIVE" | "SUSPENDED";
  requestId: string;
};

const roles: readonly string[] = [
  "PLATFORM_ADMIN", "SUPPORT", "BILLING", "AUDITOR",
];

/**
 * Internal service. Actor identity must come from the authenticated
 * server session, never from submitted form fields.
 */
export async function updatePlatformStaff(
  db: PrismaClient,
  input: UpdatePlatformStaffInput,
): Promise<{ staffId: string; authorizationVersion: number }> {
  if (
    !input.actorUserId ||
    !input.actorSessionId ||
    !input.targetStaffId ||
    !input.requestId ||
    input.requestId.length > 128 ||
    !Number.isInteger(input.expectedAuthorizationVersion) ||
    input.expectedAuthorizationVersion < 1 ||
    !roles.includes(input.role) ||
    !["ACTIVE", "SUSPENDED"].includes(input.status)
  ) {
    throw new PlatformStaffUpdateDeniedError();
  }

  return db.$transaction(async (tx) => {
    const { actor, session, now } = await requireStaffMutationContext(tx, input);

    const members = await tx.platformStaff.findMany({
      include: { user: { include: { twoFactors: true } } },
    });
    const target = members.find(
      (member) => member.id === input.targetStaffId,
    );
    if (
      !target ||
      target.authorizationVersion !== input.expectedAuthorizationVersion
    ) {
      throw new PlatformStaffUpdateDeniedError();
    }

    function eligibleIdentity(member: (typeof members)[number]): boolean {
      const factors = member.user.twoFactors;
      const factor = factors[0];
      return Boolean(
        member.user.isActive &&
        member.user.emailVerified &&
        member.user.twoFactorEnabled === true &&
        factors.length === 1 &&
        factor?.verified &&
        factor.secret &&
        (!factor.lockedUntil || factor.lockedUntil <= now)
      );
    }

    if (input.status === "ACTIVE" && !eligibleIdentity(target)) {
      throw new PlatformStaffUpdateDeniedError();
    }

    const remainingAdministrators = members.filter((member) => {
      const role = member.id === target.id ? input.role : member.role;
      const status = member.id === target.id ? input.status : member.status;
      return (
        role === "PLATFORM_ADMIN" &&
        status === "ACTIVE" &&
        eligibleIdentity(member)
      );
    });
    if (remainingAdministrators.length === 0) {
      throw new PlatformStaffUpdateDeniedError();
    }

    // Repeated submission with unchanged values has no mutation or audit.
    if (target.role === input.role && target.status === input.status) {
      return {
        staffId: target.id,
        authorizationVersion: target.authorizationVersion,
      };
    }

    const updated = await tx.platformStaff.update({
      where: { id: target.id },
      data: {
        role: input.role,
        status: input.status,
        authorizationVersion: { increment: 1 },
      },
      select: { id: true, authorizationVersion: true },
    });

    await tx.platformSessionAssurance.deleteMany({
      where: { staffId: target.id },
    });

    await tx.platformAuditLog.create({
      data: {
        actorUserId: session.userId,
        actorStaffId: actor.id,
        action: "platform.staff.update",
        targetType: "PlatformStaff",
        targetId: target.id,
        requestId: input.requestId,
        metadata: {
          before: {
            role: target.role,
            status: target.status,
            authorizationVersion: target.authorizationVersion,
          },
          after: {
            role: input.role,
            status: input.status,
            authorizationVersion: updated.authorizationVersion,
          },
        },
      },
    });

    return {
      staffId: updated.id,
      authorizationVersion: updated.authorizationVersion,
    };
  }, {
    isolationLevel: "ReadCommitted",
    maxWait: 10_000,
    timeout: 20_000,
  });
}
