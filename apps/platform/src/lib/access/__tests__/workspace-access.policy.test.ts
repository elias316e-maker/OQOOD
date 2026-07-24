import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  CurrentWorkspaceContext,
} from "@/lib/workspace-context";

import {
  WorkspaceAccessDeniedError,
  evaluateWorkspaceAccess,
  requireWorkspaceAccess,
} from "@/lib/access";

type WorkspaceStatus =
  CurrentWorkspaceContext["workspace"]["status"];

type AccessState = NonNullable<
  CurrentWorkspaceContext["workspace"]["subscription"]
>["accessState"];

function createContext(input?: {
  workspaceStatus?: WorkspaceStatus;
  accessState?: AccessState;
  includeSubscription?: boolean;
}): CurrentWorkspaceContext {
  const now = new Date();
  const periodEnd = new Date(
    now.getTime() + 30 * 24 * 60 * 60 * 1000,
  );

  return {
    id: "membership-test",
    status: "ACTIVE",
    joinedAt: now,

    roles: [
      {
        role: {
          id: "role-owner",
          code: "OWNER",
          name: "مالك مساحة العمل",
          isSystem: true,
          permissions: [],
        },
      },
    ],

    workspace: {
      id: "workspace-test",
      code: "WORKSPACE-TEST",
      slug: "workspace-test",
      nameAr: "مساحة اختبار",
      nameEn: "Test Workspace",
      status: input?.workspaceStatus ?? "ACTIVE",
      defaultLanguage: "ar",
      defaultCurrency: "SAR",
      timezone: "Asia/Riyadh",

      billingAccount: {
        id: "billing-account-test",
        legalName: "شركة اختبار",
        billingEmail: "billing@example.test",
        currency: "SAR",
        countryCode: "SA",
      },

      subscription:
        input?.includeSubscription === false
          ? null
          : {
              id: "subscription-test",
              status: "TRIALING",
              accessState:
                input?.accessState ?? "FULL",
              source: "SYSTEM_TRIAL",
              trialStartsAt: now,
              trialEndsAt: periodEnd,
              currentPeriodStartsAt: now,
              currentPeriodEndsAt: periodEnd,

              plan: {
                id: "plan-professional-v1",
                code: "PROFESSIONAL",
                version: 1,
                nameAr: "الاحترافية",
                nameEn: "Professional",
              },
            },
    },
  };
}

describe("evaluateWorkspaceAccess", () => {
  it("allows FULL access", () => {
    expect(
      evaluateWorkspaceAccess(
        createContext({
          accessState: "FULL",
        }),
      ),
    ).toEqual({
      decision: "ALLOW",
    });
  });

  it("returns READ_ONLY", () => {
    expect(
      evaluateWorkspaceAccess(
        createContext({
          accessState: "READ_ONLY",
        }),
      ),
    ).toEqual({
      decision: "READ_ONLY",
      reason: "SUBSCRIPTION_READ_ONLY",
    });
  });

  it("returns RESTRICTED", () => {
    expect(
      evaluateWorkspaceAccess(
        createContext({
          accessState: "RESTRICTED",
        }),
      ),
    ).toEqual({
      decision: "RESTRICTED",
      reason: "SUBSCRIPTION_RESTRICTED",
    });
  });

  it("blocks BLOCKED access", () => {
    expect(
      evaluateWorkspaceAccess(
        createContext({
          accessState: "BLOCKED",
        }),
      ),
    ).toEqual({
      decision: "BLOCKED",
      reason: "SUBSCRIPTION_BLOCKED",
    });
  });

  it("blocks a missing subscription", () => {
    expect(
      evaluateWorkspaceAccess(
        createContext({
          includeSubscription: false,
        }),
      ),
    ).toEqual({
      decision: "BLOCKED",
      reason: "SUBSCRIPTION_MISSING",
    });
  });

  it("blocks an inactive workspace", () => {
    expect(
      evaluateWorkspaceAccess(
        createContext({
          workspaceStatus: "DRAFT",
        }),
      ),
    ).toEqual({
      decision: "BLOCKED",
      reason: "WORKSPACE_INACTIVE",
    });
  });
});

describe("requireWorkspaceAccess", () => {
  it("returns context for FULL access", () => {
    const context = createContext({
      accessState: "FULL",
    });

    const result =
      requireWorkspaceAccess(context);

    expect(result.context).toBe(context);
    expect(result.access.decision).toBe(
      "ALLOW",
    );
  });

  it("allows READ_ONLY platform loading", () => {
    const result =
      requireWorkspaceAccess(
        createContext({
          accessState: "READ_ONLY",
        }),
      );

    expect(result.access.decision).toBe(
      "READ_ONLY",
    );
  });

  it("allows RESTRICTED platform loading", () => {
    const result =
      requireWorkspaceAccess(
        createContext({
          accessState: "RESTRICTED",
        }),
      );

    expect(result.access.decision).toBe(
      "RESTRICTED",
    );
  });

  it("throws for BLOCKED access", () => {
    expect(() =>
      requireWorkspaceAccess(
        createContext({
          accessState: "BLOCKED",
        }),
      ),
    ).toThrow(WorkspaceAccessDeniedError);
  });

  it("preserves the denial reason", () => {
    try {
      requireWorkspaceAccess(
        createContext({
          includeSubscription: false,
        }),
      );

      throw new Error(
        "Expected workspace access denial.",
      );
    } catch (error) {
      expect(error).toBeInstanceOf(
        WorkspaceAccessDeniedError,
      );

      if (
        error instanceof
        WorkspaceAccessDeniedError
      ) {
        expect(error.decision).toBe(
          "BLOCKED",
        );

        expect(error.reason).toBe(
          "SUBSCRIPTION_MISSING",
        );
      }
    }
  });
});
