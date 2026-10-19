# Platform Administration Data Model

Status: Proposed
Date: 2026-10-19
Parent decision: platform-administration.md

## PlatformStaff

- Unique userId referencing the existing User.
- Status: ACTIVE or SUSPENDED.
- Fixed role: PLATFORM_ADMIN, SUPPORT, BILLING, or AUDITOR.
- authorizationVersion incremented on role and status changes.
- createdAt and updatedAt.
- No workspaceId and no automatic workspace membership.
- Explicit role-to-permission mapping in application code.
- Staff removal initially means suspension, preserving audit history.

## PlatformSessionAssurance

- Unique sessionId referencing the existing Session.
- staffId referencing PlatformStaff.
- verifiedAt and expiresAt.
- authorizationVersion captured at verification.
- Opaque factor-version fingerprint captured at verification.
- No session token, TOTP code, or TOTP secret.
- Session deletion cascades to assurance deletion.
- Every access confirms session ownership, session expiry, user activity,
  verified email, active staff membership, role permission, assurance
  expiry, matching authorizationVersion, and matching active factor state.
- Factor reset, disable, or replacement must invalidate prior assurance.
- Failure to read or validate any required state denies access.

## PlatformVerificationThrottle

- Persistent account-level attempt and lock state.
- Additional request-origin limit using a trusted origin-address policy.
- Atomic reservation before calling provider verification.
- Limits apply across sessions and application instances.
- Lock and reset behavior must be explicit and concurrency-tested.
- Never store submitted verification codes.

## PlatformFactorReplayState

- Tracks consumed administrative TOTP time steps per factor version.
- Atomic claim prevents concurrent reuse.
- Implementation must establish the provider's accepted time step
  through a supported mechanism or an equivalently tested approach.
- Do not infer the accepted step from request time alone.
- Do not implement custom TOTP cryptography.
- Verification integration remains unresolved until this is proven.

## PlatformAuditLog

- Independent from workspace AuditLog.
- Actor user ID and staff ID, action, target type and target ID.
- Optional targetWorkspaceId only when the action targets a workspace.
- Timestamp, request correlation ID, and allowlisted metadata.
- No passwords, session tokens, factor secrets, verification codes,
  recovery codes, or tenant document contents.
- Successful administrative changes and audit insertion share a transaction.
- Audit records have no application update or delete endpoint.
- Retention, database privileges, and actor-deletion rules require
  an explicit operational policy.

## PlatformAdministrationControl

- Singleton control record used to serialize first-administrator
  provisioning and changes affecting administrator eligibility.
- Protect against simultaneous demotion or suspension of the last
  eligible administrator.
- Account deactivation and factor-reset paths must follow the same
  eligibility rules or an explicit recovery procedure.
- Database locking or serializable transactions with bounded retries
  must be validated by concurrency tests.

## Migration rules

- Additive changes only for this foundation.
- Do not modify existing workspace role or audit semantics.
- Do not grant privileges to existing accounts automatically.
- Do not provision staff through the demo seed.
- Do not apply migrations to production during development.

## Implementation gate

Before enabling the portal:
- Prove provider verification integration and replay protection.
- Finalize attempt limits and verification freshness policy.
- Test authorization, invalidation, rollback, and concurrency.
- Record architecture approval before marking decisions Accepted.
