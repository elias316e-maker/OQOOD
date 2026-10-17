import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  CurrentWorkspaceContext,
} from "@/lib/workspace-context";

import {
  PermissionDeniedError,
  Permissions,
  hasPermission,
  requirePermission,
  resolvePermissionCodes,
} from "@/lib/permissions";

type RoleInput = {
  id: string;
  code: string;
  permissions: Array<{
    id: string;
    code: string;
  }>;
};

function createContext(
  roles: RoleInput[],
): CurrentWorkspaceContext {
  const now = new Date();
  const periodEnd = new Date(
    now.getTime() + 30 * 24 * 60 * 60 * 1000,
  );

  return {
    id: "membership-test",
    status: "ACTIVE",
    joinedAt: now,

    roles: roles.map((role) => ({
      role: {
        id: role.id,
        code: role.code,
        name: role.code,
        isSystem: true,

        permissions: role.permissions.map(
          (permission) => ({
            permission: {
              id: permission.id,
              code: permission.code,
              name: permission.code,
              description: null,
            },
          }),
        ),
      },
    })),

    workspace: {
      id: "workspace-test",
      code: "WORKSPACE-TEST",
      slug: "workspace-test",
      nameAr: "مساحة اختبار",
      nameEn: "Test Workspace",
      status: "ACTIVE",
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

      subscription: {
        id: "subscription-test",
        status: "TRIALING",
        accessState: "FULL",
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

describe("resolvePermissionCodes", () => {
  it("collects permission codes from one role", () => {
    const context = createContext([
      {
        id: "role-manager",
        code: "MANAGER",
        permissions: [
          {
            id: "permission-read",
            code: Permissions.opportunities.read,
          },
          {
            id: "permission-create",
            code: Permissions.opportunities.create,
          },
        ],
      },
    ]);

    const permissions =
      resolvePermissionCodes(context);

    expect(
      [...permissions].sort(),
    ).toEqual(
      [
        Permissions.opportunities.create,
        Permissions.opportunities.read,
      ].sort(),
    );
  });

  it("combines permissions from multiple roles", () => {
    const context = createContext([
      {
        id: "role-reader",
        code: "READER",
        permissions: [
          {
            id: "permission-read",
            code: Permissions.contracts.read,
          },
        ],
      },
      {
        id: "role-editor",
        code: "EDITOR",
        permissions: [
          {
            id: "permission-update",
            code: Permissions.contracts.update,
          },
        ],
      },
    ]);

    const permissions =
      resolvePermissionCodes(context);

    expect(
      permissions.has(
        Permissions.contracts.read,
      ),
    ).toBe(true);

    expect(
      permissions.has(
        Permissions.contracts.update,
      ),
    ).toBe(true);
  });

  it("removes duplicate permissions", () => {
    const context = createContext([
      {
        id: "role-one",
        code: "ROLE_ONE",
        permissions: [
          {
            id: "permission-read-one",
            code: Permissions.vendors.read,
          },
        ],
      },
      {
        id: "role-two",
        code: "ROLE_TWO",
        permissions: [
          {
            id: "permission-read-two",
            code: Permissions.vendors.read,
          },
        ],
      },
    ]);

    const permissions =
      resolvePermissionCodes(context);

    expect(
      [...permissions].filter(
        (permission) =>
          permission ===
          Permissions.vendors.read,
      ),
    ).toHaveLength(1);
  });

  it("returns an empty set when roles have no permissions", () => {
    const context = createContext([
      {
        id: "role-empty",
        code: "EMPTY",
        permissions: [],
      },
    ]);

    expect(
      resolvePermissionCodes(context).size,
    ).toBe(0);
  });
});

describe("hasPermission", () => {
  it("returns true when permission exists", () => {
    const context = createContext([
      {
        id: "role-procurement",
        code: "PROCUREMENT",
        permissions: [
          {
            id: "permission-create",
            code: Permissions.procurement.create,
          },
        ],
      },
    ]);

    expect(
      hasPermission(
        context,
        Permissions.procurement.create,
      ),
    ).toBe(true);
  });

  it("returns false when permission is absent", () => {
    const context = createContext([
      {
        id: "role-reader",
        code: "READER",
        permissions: [
          {
            id: "permission-read",
            code: Permissions.opportunities.read,
          },
        ],
      },
    ]);

    expect(
      hasPermission(
        context,
        Permissions.opportunities.delete,
      ),
    ).toBe(false);
  });
});

describe("requirePermission", () => {
  it("returns the requested permission when granted", () => {
    const context = createContext([
      {
        id: "role-owner",
        code: "OWNER",
        permissions: [
          {
            id: "permission-manage-members",
            code:
              Permissions.workspace.manageMembers,
          },
        ],
      },
    ]);

    expect(
      requirePermission(
        context,
        Permissions.workspace.manageMembers,
      ),
    ).toBe(
      Permissions.workspace.manageMembers,
    );
  });

  it("throws PermissionDeniedError when permission is missing", () => {
    const context = createContext([
      {
        id: "role-member",
        code: "MEMBER",
        permissions: [],
      },
    ]);

    expect(() =>
      requirePermission(
        context,
        Permissions.contracts.approve,
      ),
    ).toThrow(PermissionDeniedError);
  });

  it("preserves the denied permission code", () => {
    const context = createContext([]);

    try {
      requirePermission(
        context,
        Permissions.opportunities.award,
      );

      throw new Error(
        "Expected permission denial.",
      );
    } catch (error) {
      expect(error).toBeInstanceOf(
        PermissionDeniedError,
      );

      if (
        error instanceof PermissionDeniedError
      ) {
        expect(error.permission).toBe(
          Permissions.opportunities.award,
        );
      }
    }
  });
});
