import { describe, expect, it } from "vitest";
import {
  canAccessPlatform,
  type PlatformAccessState,
} from "../access-policy";

const now = new Date("2026-10-19T10:00:00Z");
const permission = "platform.staff.manage";

function fixture(): PlatformAccessState {
  return {
    user: {
      id: "u1", isActive: true,
      emailVerified: true, twoFactorEnabled: true,
    },
    session: {
      id: "s1", userId: "u1",
      expiresAt: new Date("2026-10-19T11:00:00Z"),
    },
    staff: {
      id: "a1", userId: "u1", status: "ACTIVE",
      role: "PLATFORM_ADMIN", authorizationVersion: 1,
    },
    factor: {
      id: "f1", userId: "u1", verified: true, version: "opaque-v1",
    },
    assurance: {
      sessionId: "s1", staffId: "a1", factorId: "f1",
      factorVersion: "opaque-v1", authorizationVersion: 1,
      verifiedAt: new Date("2026-10-19T09:59:00Z"),
      expiresAt: new Date("2026-10-19T10:14:00Z"),
    },
  };
}

describe("Platform administrative access policy", () => {
  it("accepts matching active state with fresh assurance", () => {
    expect(canAccessPlatform(fixture(), permission, now, true)).toBe(true);
  });

  const denied: Array<[string, (s: PlatformAccessState) => void]> = [
    ["inactive user", (s) => { s.user.isActive = false; }],
    ["unverified email", (s) => { s.user.emailVerified = false; }],
    ["disabled 2FA", (s) => { s.user.twoFactorEnabled = false; }],
    ["suspended staff", (s) => { s.staff.status = "SUSPENDED"; }],
    ["workspace owner role", (s) => { s.staff.role = "OWNER"; }],
    ["insufficient role", (s) => { s.staff.role = "SUPPORT"; }],
    ["foreign session", (s) => { s.session.userId = "other"; }],
    ["foreign staff", (s) => { s.staff.userId = "other"; }],
    ["foreign factor", (s) => { s.factor.userId = "other"; }],
    ["unverified factor", (s) => { s.factor.verified = false; }],
    ["replaced factor", (s) => { s.factor.id = "new-factor"; }],
    ["reset factor", (s) => { s.factor.version = "opaque-v2"; }],
    ["changed role version", (s) => { s.staff.authorizationVersion = 2; }],
    ["missing assurance", (s) => { s.assurance = null; }],
    ["rotated session", (s) => { s.session.id = "new-session"; }],
    ["different membership", (s) => { s.staff.id = "new-staff"; }],
    ["expired session", (s) => { s.session.expiresAt = now; }],
    ["invalid date", (s) => { s.session.expiresAt = new Date("invalid"); }],
  ];

  it.each(denied)("denies %s", (_name, mutate) => {
    const state = fixture();
    mutate(state);
    expect(canAccessPlatform(state, permission, now)).toBe(false);
  });

  it("requires fresher assurance for sensitive actions", () => {
    const state = fixture();
    if (!state.assurance) throw new Error("Missing fixture assurance.");
    state.assurance.verifiedAt = new Date("2026-10-19T09:54:00Z");
    state.assurance.expiresAt = new Date("2026-10-19T10:09:00Z");
    expect(canAccessPlatform(state, permission, now)).toBe(true);
    expect(canAccessPlatform(state, permission, now, true)).toBe(false);
  });

  it("denies future, expired, and overlong assurance", () => {
    for (const [verifiedAt, expiresAt] of [
      ["2026-10-19T10:01:00Z", "2026-10-19T10:14:00Z"],
      ["2026-10-19T09:45:00Z", "2026-10-19T10:00:00Z"],
      ["2026-10-19T09:59:00Z", "2026-10-19T10:30:00Z"],
      ["2026-10-19T09:59:00Z", "2026-10-19T11:01:00Z"],
    ]) {
      const state = fixture();
      if (!state.assurance) throw new Error("Missing fixture assurance.");
      state.assurance.verifiedAt = new Date(verifiedAt);
      state.assurance.expiresAt = new Date(expiresAt);
      expect(canAccessPlatform(state, permission, now)).toBe(false);
    }
  });

  it("denies an unknown permission", () => {
    expect(canAccessPlatform(fixture(), "unknown", now)).toBe(false);
  });
});
