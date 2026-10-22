import { describe, expect, it } from "vitest";

import {
  authReturnPathFromSearch,
  safeAuthReturnPath,
  twoFactorPathFromSearch,
} from "./auth-return-path";

describe("authentication return destinations", () => {
  it("preserves the administrative verification destination", () => {
    const search = "?callbackURL=%2Fadmin%2Fverify";
    expect(authReturnPathFromSearch(search)).toBe("/admin/verify");
    expect(twoFactorPathFromSearch(search)).toBe(
      "/two-factor?callbackURL=%2Fadmin%2Fverify",
    );
  });

  it("preserves internal query parameters and fragments", () => {
    expect(safeAuthReturnPath("/platform/opportunities?status=DRAFT#list"))
      .toBe("/platform/opportunities?status=DRAFT#list");
  });

  it.each([
    null,
    "",
    "https://example.com",
    "//example.com",
    "javascript:alert(1)",
    "/\\example.com",
    "/%5cexample.com",
    "/%2fexample.com",
    "/%0aexample.com",
    "/bad%",
    "/login",
    "/two-factor?callbackURL=/admin",
    "/register",
    "/platform/../login",
  ])("rejects unsafe or looping destination %s", (value) => {
    expect(safeAuthReturnPath(value)).toBe("/platform");
  });

  it("defaults ordinary login to the workspace", () => {
    expect(authReturnPathFromSearch("")).toBe("/platform");
    expect(twoFactorPathFromSearch("")).toBe(
      "/two-factor?callbackURL=%2Fplatform",
    );
  });
});
