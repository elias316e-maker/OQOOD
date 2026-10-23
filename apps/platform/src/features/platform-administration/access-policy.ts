import { platformRoleHasPermission } from "./permissions";

export type PlatformAccessState = {
  user: {
    id: string;
    isActive: boolean;
    emailVerified: boolean;
    twoFactorEnabled: boolean;
  };
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
  };
  staff: {
    id: string;
    userId: string;
    status: string;
    role: string;
    authorizationVersion: number;
  };
  factor: {
    id: string;
    userId: string;
    verified: boolean;
    lockedUntil?: Date | null;
    version: string;
  };
  assurance: {
    sessionId: string;
    staffId: string;
    factorId: string;
    factorVersion: string;
    authorizationVersion: number;
    verifiedAt: Date;
    expiresAt: Date;
  } | null;
};

const ACCESS_MAX_AGE = 15 * 60_000;
const SENSITIVE_MAX_AGE = 5 * 60_000;

export function canAccessPlatform(
  state: PlatformAccessState,
  permission: string,
  now: Date,
  sensitive = false,
): boolean {
  const { user, session, staff, factor, assurance } = state;
  if (!assurance) return false;

  const timestamps = [
    now, session.expiresAt, assurance.verifiedAt, assurance.expiresAt,
  ].map((date) => date.getTime());
  if (timestamps.some((value) => !Number.isFinite(value))) return false;

  const [current, sessionExpiry, verified, assuranceExpiry] = timestamps;
  const age = current - verified;
  const maxAge = sensitive ? SENSITIVE_MAX_AGE : ACCESS_MAX_AGE;

  return Boolean(
    user.id &&
    session.id &&
    staff.id &&
    factor.id &&
    user.isActive &&
    user.emailVerified &&
    user.twoFactorEnabled &&
    staff.status === "ACTIVE" &&
    factor.verified &&
    (!factor.lockedUntil || (
      Number.isFinite(factor.lockedUntil.getTime()) &&
      factor.lockedUntil.getTime() <= current
    )) &&
    session.userId === user.id &&
    staff.userId === user.id &&
    factor.userId === user.id &&
    assurance.sessionId === session.id &&
    assurance.staffId === staff.id &&
    assurance.factorId === factor.id &&
    factor.version &&
    assurance.factorVersion === factor.version &&
    Number.isInteger(staff.authorizationVersion) &&
    staff.authorizationVersion > 0 &&
    assurance.authorizationVersion === staff.authorizationVersion &&
    sessionExpiry > current &&
    assuranceExpiry > current &&
    assuranceExpiry <= sessionExpiry &&
    assuranceExpiry > verified &&
    assuranceExpiry - verified <= ACCESS_MAX_AGE &&
    age >= 0 &&
    age < maxAge &&
    platformRoleHasPermission(staff.role, permission)
  );
}
