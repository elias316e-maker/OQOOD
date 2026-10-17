# DEV-0200 Integration Test Blocker

## Status

BLOCKED — Environment / Network

## Date

2026-07-22

## Affected Gate

Opportunity integration and rollback tests.

## Confirmed Results

- DNS resolution for Neon succeeds.
- DATABASE_URL is loaded correctly.
- Prisma Client initializes correctly.
- Direct Prisma query fails with ETIMEDOUT.
- IPv4 TCP connection to Neon port 5432 times out.
- Opportunity validation tests execute successfully.
- The failure occurs before Opportunity test setup completes.

## Root Cause

The active GitHub Codespace cannot establish an outbound TCP
connection to the configured Neon PostgreSQL endpoint on port 5432.

## Not a Code Failure

The blocker is not caused by:

- Opportunity Domain implementation
- Prisma schema
- User model validation
- Server Actions
- Permission Enforcement
- Opportunity UI Integration
- Integration test business assertions

## Required Resolution

Run database integration tests from an environment that can access
the Neon endpoint on port 5432, such as:

- A new unrestricted GitHub Codespace
- GitHub Actions
- A local development environment
- Another approved CI runner

DEV-0200 cannot receive final QA closure until the complete integration
and rollback test suite passes in an accessible environment.
