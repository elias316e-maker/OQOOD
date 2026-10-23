import {
  afterEach, beforeEach, describe, expect, it, vi,
} from "vitest";

const mocks = vi.hoisted(() => ({
  headers: vi.fn(),
  authorize: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  revalidate: vi.fn(),
}));

vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

vi.mock("../require-platform-permission", () => ({
  requirePlatformPermission: mocks.authorize,
  PlatformAccessDeniedError: class PlatformAccessDeniedError extends Error {},
}));

vi.mock("../create-platform-staff", async (importOriginal) => ({
  ...await importOriginal<typeof import("../create-platform-staff")>(),
  createPlatformStaff: mocks.create,
}));

vi.mock("../update-platform-staff", async (importOriginal) => ({
  ...await importOriginal<typeof import("../update-platform-staff")>(),
  updatePlatformStaff: mocks.update,
}));

import { createStaffAction } from "@/app/admin/staff/create-actions";
import { updateStaffMembershipAction } from "@/app/admin/staff/actions";
import { PlatformPermissions } from "../permissions";
import { PlatformAccessDeniedError } from "../require-platform-permission";

const previous = { success: false, message: "" };

function validForm() {
  const data = new FormData();
  data.set("targetUserId", "selected-user");
  data.set("staffId", "selected-staff");
  data.set("role", "SUPPORT");
  data.set("status", "SUSPENDED");
  data.set("authorizationVersion", "3");
  data.set("confirmed", "on");
  return data;
}

const cases = [
  { name: "create", action: createStaffAction, mutation: mocks.create },
  { name: "update", action: updateStaffMembershipAction, mutation: mocks.update },
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("PLATFORM_ADMIN_PORTAL_ENABLED", "true");
  vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3000");

  mocks.headers.mockReset().mockResolvedValue(
    new Headers({ origin: "http://localhost:3000" }),
  );
  mocks.authorize.mockReset().mockResolvedValue({
    userId: "authenticated-user",
    sessionId: "authenticated-session",
    staffId: "authenticated-staff",
    role: "PLATFORM_ADMIN",
    authorizationVersion: 1,
  });
  mocks.create.mockReset().mockResolvedValue({ staffId: "new-staff" });
  mocks.update.mockReset().mockResolvedValue({
    staffId: "selected-staff", authorizationVersion: 4,
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe.each(cases)("$name administrative action", ({ name, action, mutation }) => {
  it("denies direct calls while the portal is disabled", async () => {
    vi.stubEnv("PLATFORM_ADMIN_PORTAL_ENABLED", "false");
    const result = await action(previous, validForm());
    expect(result.success).toBe(false);
    expect(mocks.authorize).not.toHaveBeenCalled();
    expect(mutation).not.toHaveBeenCalled();
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });

  it.each([null, "https://example.invalid"])(
    "denies a missing or foreign origin: %s",
    async (origin) => {
      mocks.headers.mockResolvedValue(
        origin ? new Headers({ origin }) : new Headers(),
      );
      const result = await action(previous, validForm());
      expect(result.success).toBe(false);
      expect(mocks.authorize).not.toHaveBeenCalled();
      expect(mutation).not.toHaveBeenCalled();
    },
  );

  it("rejects an unknown role", async () => {
    const data = validForm();
    data.set("role", "OWNER");
    const result = await action(previous, data);
    expect(result.success).toBe(false);
    expect(mutation).not.toHaveBeenCalled();
  });

  it("requires current server authorization before mutation", async () => {
    mocks.authorize.mockRejectedValue(new PlatformAccessDeniedError());
    const result = await action(previous, validForm());
    expect(result.success).toBe(false);
    expect(mocks.authorize).toHaveBeenCalledWith(
      PlatformPermissions.staffManage, true,
    );
    expect(mutation).not.toHaveBeenCalled();
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });

  it("uses authenticated actor identity instead of submitted identity", async () => {
    const data = validForm();
    data.set("actorUserId", "forged-user");
    data.set("actorSessionId", "forged-session");
    const result = await action(previous, data);

    expect(result.success).toBe(true);
    expect(mutation).toHaveBeenCalledTimes(1);
    expect(mocks.authorize).toHaveBeenCalledWith(
      PlatformPermissions.staffManage, true,
    );
    expect(mutation.mock.calls[0][1]).toMatchObject({
      actorUserId: "authenticated-user",
      actorSessionId: "authenticated-session",
      role: "SUPPORT",
      ...(name === "create"
        ? { targetUserId: "selected-user" }
        : {
            targetStaffId: "selected-staff",
            expectedAuthorizationVersion: 3,
            status: "SUSPENDED",
          }),
    });
    expect(mutation.mock.calls[0][1].requestId).toEqual(expect.any(String));
    expect(mocks.revalidate).toHaveBeenCalledWith("/admin/staff");
  });

  it("returns a generic failure without exposing internal errors", async () => {
    mutation.mockRejectedValue(new Error("private database diagnostic"));
    const result = await action(previous, validForm());
    expect(result.success).toBe(false);
    expect(result.message).not.toContain("private database diagnostic");
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });

  it("rejects missing confirmation or an invalid version", async () => {
    const data = validForm();
    if (name === "create") data.delete("confirmed");
    else data.set("authorizationVersion", "invalid");

    const result = await action(previous, data);
    expect(result.success).toBe(false);
    expect(mutation).not.toHaveBeenCalled();
  });
});
