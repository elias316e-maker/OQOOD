# Platform Administration Foundation

Status: Proposed
Date: 2026-10-19
Decision ID: Pending architecture register assignment

## Context

Current roles belong to workspaces. Workspace ownership does not grant
platform administration privileges.

The existing AuditLog requires a workspaceId. Platform administration
must support actions that do not belong to a workspace.

Better Auth provides the current identity and two-factor integration.
The implementation must verify how the installed version proves
two-factor verification for the current session.

## Proposed decision

1. Reuse the existing identity provider and User accounts.
2. Provide a separate /admin portal outside workspace onboarding guards.
3. Store platform staff membership and role assignments separately from
   workspace membership and workspace roles.
4. Deny access by default. Check current user activity, current staff
   membership, and the required permission on the server for every
   administrative read and mutation.
5. Require verified email and two-factor authentication for administrators.
   A twoFactorEnabled account flag alone is not proof that the current
   session completed the required challenge.
6. Require recent authentication for sensitive administrative changes.
7. Recheck authorization from authoritative state so disabling membership
   or changing roles affects existing sessions.
8. Use a separate platform audit record. Do not create a fake workspace
   or relax existing tenant audit requirements.
9. Persist successful administrative mutations and their audit events
   atomically. Audit failure must roll back the mutation.
10. Provision the first administrator through an explicit operational
    procedure for a specific existing, verified account. No default
    password, public bootstrap endpoint, or email-based privilege shortcut.
11. Prevent concurrent changes from disabling or demoting the last
    eligible active platform administrator.
12. Platform roles do not bypass workspace authorization and do not grant
    automatic access to tenant documents, bids, or contract contents.

## Initial role matrix

These are proposed permissions, not implemented capabilities.
Metadata excludes tenant business content and authentication secrets.

| Capability | Platform administrator | Support | Billing | Auditor |
| --- | --- | --- | --- | --- |
| Access administration portal | Yes | Yes | Yes | Yes |
| Read workspace operational metadata | Yes | Yes | Limited billing context | Yes |
| Read subscription and usage metadata | Yes | No | Yes | Yes |
| Read platform administrative audit | Yes | No | No | Yes |
| Manage platform staff and role assignments | Yes | No | No | No |
| Suspend or reactivate a workspace | Yes | No | No | No |
| Change subscription terms | Deferred | No | Deferred | No |
| Read tenant business content | No | No | No | No |
| Impersonate a tenant user | No | No | No | No |
| Delete a tenant permanently | No | No | No | No |

Role checks must resolve explicit permissions; interface visibility is
not an authorization boundary. Unknown permissions are denied.

## Delivery stages

### Stage 1: Access foundation

- Platform membership, fixed initial roles, and permission registry.
- Server access guards and authorization policy.
- Independent platform audit model.
- Explicit first-administrator provisioning procedure.
- Session-level two-factor assurance and sensitive-action freshness.
- Minimal protected administration portal.

### Stage 2: Staff administration

- Staff listing and role assignment.
- Membership activation and suspension.
- Atomic audit records.
- Concurrent last-administrator protection.

### Stage 3: Operational modules

- Workspace operational metadata.
- Subscription and usage visibility.
- Workspace suspension rules and enforcement across tenant requests.
- Separate decisions for subscription mutations or support access.

## Required verification

- Anonymous users cannot access administrative data or actions.
- Workspace owners without platform membership are denied.
- Inactive users and inactive platform members are denied.
- Each role is denied permissions outside its matrix.
- Direct action and route calls enforce authorization.
- Missing, expired, or insufficient two-factor assurance is denied.
- Existing sessions lose administrative access after membership removal.
- Tenant isolation remains intact.
- Audit failure rolls back administrative mutations.
- Concurrent changes cannot remove the last eligible administrator.
- Bootstrap cannot be repeated to elevate another account.
- Audit metadata excludes passwords, tokens, secrets, and document contents.

## Open implementation questions

- Installed Better Auth session-level two-factor assurance mechanism.
- Challenge freshness, recovery, and trusted-device policy for administrators.
- Final database model and transaction strategy.
- Audit retention and operational access policy.
- First-administrator provisioning and recovery procedure.

## Alternatives

- Reusing workspace OWNER: rejected because it conflates tenant and
  platform privileges.
- A hardcoded administrator email: rejected because identity is not
  authorization.
- A separate identity provider: deferred pending operational need.

## Approval

This document is a proposal. It does not authorize production privilege
assignment or establish that administrative capabilities already exist.

## Administrative session assurance

Status: Proposed; implementation pending.

- Require an authenticated session, an active verified user, active
  platform membership, and an enrolled verified second factor.
- Require an explicit administrative TOTP challenge even when the
  ordinary login used a trusted device.
- Verify the code on the server through the supported authentication
  provider integration. Do not implement custom TOTP cryptography.
- Store assurance on the server, bound to the exact session ID and user.
  Never accept a browser flag or submitted timestamp as proof.
- Proposed assurance lifetime: 15 minutes, capped by session expiry.
- Sensitive mutations require assurance obtained within 5 minutes.
- Successful reads and ordinary session refresh do not extend assurance.
- New or rotated sessions require new assurance.
- Enforce current user, membership, role, and second-factor state on
  every administrative request.
- Membership or role changes invalidate prior administrative assurance.
- Disabling or resetting the second factor invalidates assurance.
  Re-enrollment must not revive an old assurance record.
- Logout and session revocation invalidate assurance.
- Persist rate limits server-side and update attempt counters atomically.
  Apply limits across sessions for the account, with an additional
  request-origin limit. A session-based counter alone is insufficient.
- Do not rely solely on the provider's sign-in attempt counter for an
  authenticated step-up challenge.
- Prevent reuse of a successfully consumed TOTP time step for another
  administrative challenge, including concurrent requests.
- Protect verification against cross-site requests and do not log codes,
  session tokens, TOTP secrets, or recovery codes.
- Fail closed if assurance cannot be persisted.
- Recovery codes do not grant administrative assurance in the initial
  implementation. Define an explicit operational recovery procedure.
- Verify these behaviors with integration and concurrency tests before
  enabling administrative access.

### Additional implementation questions

- Supported provider API and middleware for authenticated TOTP checks.
- Durable atomic rate-limiting and replay-protection implementation.
- Reliable invalidation on factor disable/reset and role changes.
- Final approval of freshness durations and attempt limits.
