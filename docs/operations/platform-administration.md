# Platform administration operations

Status: implementation guide; production activation requires explicit authorization.

## Preparation
- Review role assignments and the architecture proposal.
- Confirm deployment and database before applying migrations.
- Configure BETTER_AUTH_URL, BETTER_AUTH_SECRET, RESEND_API_KEY and NOTIFICATION_FROM_EMAIL through the secret store.
- Run npm run test:admin from apps/platform.
- Test interactive enrollment in a restricted staging deployment.
- Workspace ownership does not grant administrative membership.

## Account preparation
1. Sign in to the selected existing account.
2. Complete email verification at /admin/verify.
3. Enroll TOTP at /admin/security.
4. Store recovery codes securely.
5. Confirm the exact user ID and account email.

These steps do not grant administrative membership.

## Provisioning
Run scripts/bootstrap-platform-administrator.ts using pnpm exec tsx from apps/platform.
Required options: --user-id, --expected-email, --expected-db-name, --operator-reference.
The default is a read-only dry-run.
Only an authorized operator may repeat the reviewed command with --apply.
The email confirms the selected identity; it is not an authorization shortcut.
The service rechecks eligibility under transactional locks.
Membership, bootstrap state and audit are committed atomically.
Existing staff or completed bootstrap blocks repeat provisioning.

## Acceptance
Confirm anonymous denial, workspace-owner denial, explicit TOTP verification,
staff permission enforcement, five-minute sensitive-action freshness,
proof revocation after membership changes and last-administrator protection.
New memberships start suspended.

## Recovery
If another eligible administrator remains, suspend the affected membership,
restore the identity through the provider, review eligibility and reactivate.
If all administrators lose access, disable the portal and open an incident.
Preserve audit records. Do not delete the bootstrap marker, manually verify
email or fabricate assurance records.
Emergency privilege recovery is not implemented in this release.
A separately reviewed audited recovery procedure is required before
production-critical reliance on this portal.

## Maintenance and disablement
Replay protection lasts fifteen minutes. Provider window assumptions must
be rechecked after authentication dependency changes.
Expired verification state is reclaimed in bounded batches; audit logs remain.
Set PLATFORM_ADMIN_PORTAL_ENABLED=false to disable the portal.
This does not revoke ordinary account sessions.
