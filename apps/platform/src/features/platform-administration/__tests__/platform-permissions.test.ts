import { describe, expect, it } from "vitest";

import {
  PlatformPermissions as P,
  platformRoleHasPermission,
} from "../permissions";

describe("Platform administration permission boundaries", () => {
  it("grants the administrator the explicitly defined permissions", () => {
    for (const permission of Object.values(P)) {
      expect(platformRoleHasPermission("PLATFORM_ADMIN", permission)).toBe(true);
    }
  });

  it("limits support to portal access and workspace metadata", () => {
    for (const permission of Object.values(P)) {
      const expected = permission === P.portalAccess ||
        permission === P.workspaceRead;
      expect(platformRoleHasPermission("SUPPORT", permission)).toBe(expected);
    }
  });

  it("limits billing to portal access and subscription metadata", () => {
    for (const permission of Object.values(P)) {
      const expected = permission === P.portalAccess ||
        permission === P.billingRead;
      expect(platformRoleHasPermission("BILLING", permission)).toBe(expected);
    }
  });

  it("gives auditors read permissions without administrative mutations", () => {
    for (const permission of Object.values(P)) {
      const expected = [
        P.portalAccess, P.workspaceRead, P.billingRead, P.auditRead,
      ].some((allowed) => allowed === permission);
      expect(platformRoleHasPermission("AUDITOR", permission)).toBe(expected);
    }
  });

  it("does not treat workspace roles as platform roles", () => {
    for (const role of ["OWNER", "ADMIN", "MEMBER", ""]) {
      for (const permission of Object.values(P)) {
        expect(platformRoleHasPermission(role, permission)).toBe(false);
      }
    }
  });

  it("denies unknown and inherited object property names", () => {
    for (const role of ["UNKNOWN", "constructor", "__proto__", "toString"]) {
      expect(platformRoleHasPermission(role, P.portalAccess)).toBe(false);
    }
    expect(platformRoleHasPermission("PLATFORM_ADMIN", "platform.unknown")).toBe(false);
  });

  it("does not grant tenant-content access or impersonation", () => {
    for (const role of ["PLATFORM_ADMIN", "SUPPORT", "BILLING", "AUDITOR"]) {
      for (const permission of [
        "opportunities.read",
        "contracts.read",
        "documents.read",
        "platform.impersonate",
        "platform.billing.update",
      ]) {
        expect(platformRoleHasPermission(role, permission)).toBe(false);
      }
    }
  });
});
