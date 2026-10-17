import {
  describe,
  expect,
  it,
} from "vitest";

import {
  WorkspaceWriteAccessDeniedError,
  evaluateWorkspaceWriteAccess,
  requireWorkspaceWriteAccess,
} from "@/lib/access";

describe(
  "evaluateWorkspaceWriteAccess",
  () => {
    it(
      "allows writes for full workspace access",
      () => {
        expect(
          evaluateWorkspaceWriteAccess({
            decision: "ALLOW",
          }),
        ).toEqual({
          decision: "ALLOW_WRITE",
          reason: "WORKSPACE_FULL_ACCESS",
        });
      },
    );

    it(
      "denies writes for read-only access",
      () => {
        expect(
          evaluateWorkspaceWriteAccess({
            decision: "READ_ONLY",
            reason:
              "SUBSCRIPTION_READ_ONLY",
          }),
        ).toEqual({
          decision: "DENY_WRITE",
          reason: "WORKSPACE_READ_ONLY",
        });
      },
    );

    it(
      "denies writes for restricted access",
      () => {
        expect(
          evaluateWorkspaceWriteAccess({
            decision: "RESTRICTED",
            reason:
              "SUBSCRIPTION_RESTRICTED",
          }),
        ).toEqual({
          decision: "DENY_WRITE",
          reason: "WORKSPACE_RESTRICTED",
        });
      },
    );

    it(
      "denies writes for blocked access",
      () => {
        expect(
          evaluateWorkspaceWriteAccess({
            decision: "BLOCKED",
            reason:
              "SUBSCRIPTION_BLOCKED",
          }),
        ).toEqual({
          decision: "DENY_WRITE",
          reason: "WORKSPACE_BLOCKED",
        });
      },
    );
  },
);

describe(
  "requireWorkspaceWriteAccess",
  () => {
    it(
      "returns write access for allowed context",
      () => {
        expect(
          requireWorkspaceWriteAccess({
            decision: "ALLOW",
          }),
        ).toEqual({
          decision: "ALLOW_WRITE",
          reason: "WORKSPACE_FULL_ACCESS",
        });
      },
    );

    it(
      "throws for read-only access",
      () => {
        expect(() =>
          requireWorkspaceWriteAccess({
            decision: "READ_ONLY",
            reason:
              "SUBSCRIPTION_READ_ONLY",
          }),
        ).toThrow(
          WorkspaceWriteAccessDeniedError,
        );
      },
    );

    it(
      "preserves the denial reason",
      () => {
        try {
          requireWorkspaceWriteAccess({
            decision: "RESTRICTED",
            reason:
              "SUBSCRIPTION_RESTRICTED",
          });

          throw new Error(
            "Expected write access denial.",
          );
        } catch (error) {
          expect(error).toBeInstanceOf(
            WorkspaceWriteAccessDeniedError,
          );

          if (
            error instanceof
            WorkspaceWriteAccessDeniedError
          ) {
            expect(error.reason).toBe(
              "WORKSPACE_RESTRICTED",
            );
          }
        }
      },
    );
  },
);
