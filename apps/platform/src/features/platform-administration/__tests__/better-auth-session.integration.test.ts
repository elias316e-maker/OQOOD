import { createHmac, randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import type { PrismaClient } from "@/generated/prisma/client";
import { bootstrapPlatformAdministrator } from "../bootstrap-platform-administrator";

const emailDelivery = vi.hoisted(() => ({
  send: vi.fn(),
}));

// Capture delivery only; use the real provider for token creation/validation.
vi.mock("@/lib/auth-email", () => ({
  sendAuthenticationEmail: emailDelivery.send,
}));

const connectionString = process.env.ADMIN_AUTH_TEST_DATABASE_URL;
const origin = "http://localhost:3000";

function fixtureTotp(secret: string): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const character of secret.toUpperCase().replace(/=+$/, "")) {
    const value = alphabet.indexOf(character);
    if (value < 0) throw new Error("Invalid fixture secret.");
    bits += value.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(Number.parseInt(bits.slice(i, i + 8), 2));
  }
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30_000)));
  const digest = createHmac("sha1", Buffer.from(bytes))
    .update(counter)
    .digest();
  const offset = digest[digest.length - 1] & 15;
  const value = digest.readUInt32BE(offset) & 0x7fffffff;
  return String(value % 1_000_000).padStart(6, "0");
}

describe.skipIf(!connectionString)("Better Auth administrative session integration", () => {
  let db: PrismaClient;
  let auth: (typeof import("@/lib/auth"))["auth"];
  let verify: (typeof import("../verify-platform-session"))["verifyPlatformSession"];

  beforeAll(async () => {
    const url = new URL(connectionString!);
    if (
      !["127.0.0.1", "localhost"].includes(url.hostname) ||
      url.pathname !== "/oqood_admin_auth_test" ||
      process.env.DATABASE_URL !== connectionString ||
      process.env.BETTER_AUTH_URL !== origin
    ) {
      throw new Error("A dedicated local authentication test database is required.");
    }

    // Import production clients only after validating the isolated environment.
    db = (await import("@/lib/prisma")).prisma;
    auth = (await import("@/lib/auth")).auth;
    verify = (await import("../verify-platform-session")).verifyPlatformSession;
  });

  afterAll(async () => {
    await db?.$disconnect();
  });

  it("uses real provider verification and persists only eligible, non-replayed proofs", async () => {
    const jar = new Map<string, string>();

    function requestHeaders() {
      const headers = new Headers({
        origin,
        "content-type": "application/json",
      });
      headers.set(
        "cookie",
        [...jar].map(([name, value]) => `${name}=${value}`).join("; "),
      );
      return headers;
    }

    async function request(path: string, body?: Record<string, unknown>) {
      const response = await auth.handler(new Request(
        `${origin}/api/auth${path}`,
        {
          method: body ? "POST" : "GET",
          headers: requestHeaders(),
          ...(body ? { body: JSON.stringify(body) } : {}),
        },
      ));

      for (const cookie of response.headers.getSetCookie()) {
        const pair = cookie.split(";")[0];
        const separator = pair.indexOf("=");
        const name = pair.slice(0, separator);
        const value = pair.slice(separator + 1);
        if (!value || /max-age=0(?:;|$)/i.test(cookie)) {
          jar.delete(name);
        } else {
          jar.set(name, value);
        }
      }
      return response;
    }

    const email = `${randomUUID()}@example.invalid`;
    const password = "Isolated-administrator-password-2026!";
    const signup = await request("/sign-up/email", {
      name: "Administrative integration fixture",
      email,
      password,
    });
    expect(signup.status).toBe(200);

    const enable = await request("/two-factor/enable", { password });
    expect(enable.status).toBe(200);
    const enrollment = await enable.json() as { totpURI: string };
    const secret = new URL(enrollment.totpURI).searchParams.get("secret");
    if (!secret) throw new Error("Missing isolated fixture factor.");

    const enrolled = await request("/two-factor/verify-totp", {
      code: fixtureTotp(secret),
      trustDevice: false,
    });
    expect(enrolled.status).toBe(200);

    const user = await db.user.findUniqueOrThrow({ where: { email } });
    // Test fixture only: simulate completed email verification.
    await db.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });

    const session = await auth.api.getSession({ headers: requestHeaders() });
    if (!session) throw new Error("Missing authenticated fixture session.");
    const sessionId = session.session.id;
    const trustedSource = randomUUID();

    // An ordinary authenticated user must not receive administrative assurance.
    await expect(
      verify(requestHeaders(), fixtureTotp(secret), trustedSource),
    ).rejects.toThrow();
    expect(await db.platformSessionAssurance.count()).toBe(0);

    await bootstrapPlatformAdministrator(db, {
      userId: user.id,
      operatorReference: "isolated-authentication-test",
      requestId: randomUUID(),
    });

    const foreignOrigin = requestHeaders();
    foreignOrigin.set("origin", "https://example.invalid");
    await expect(
      verify(foreignOrigin, fixtureTotp(secret), trustedSource),
    ).rejects.toThrow();

    const missingOrigin = requestHeaders();
    missingOrigin.delete("origin");
    await expect(
      verify(missingOrigin, fixtureTotp(secret), trustedSource),
    ).rejects.toThrow();

    const anonymous = new Headers({ origin });
    await expect(
      verify(anonymous, fixtureTotp(secret), trustedSource),
    ).rejects.toThrow();

    // Find a numeric code rejected by the actual provider, then verify
    // that the administrative adapter also rejects it without a proof.
    let invalidCode: string | undefined;
    for (const candidate of ["000000", "111111", "222222"]) {
      const response = await request("/two-factor/verify-totp", {
        code: candidate,
        trustDevice: false,
      });
      if (!response.ok) {
        invalidCode = candidate;
        break;
      }
    }
    if (!invalidCode) throw new Error("Could not select an invalid fixture code.");

    await expect(
      verify(requestHeaders(), invalidCode, trustedSource),
    ).rejects.toThrow();
    expect(await db.platformSessionAssurance.count()).toBe(0);

    const code = fixtureTotp(secret);
    const result = await verify(requestHeaders(), code, trustedSource);
    const assurance = await db.platformSessionAssurance.findUniqueOrThrow({
      where: { sessionId },
    });
    expect(assurance.expiresAt).toEqual(result.expiresAt);
    expect(assurance.expiresAt.getTime() - assurance.verifiedAt.getTime())
      .toBeLessThanOrEqual(15 * 60_000);

    expect(await db.platformAuditLog.count({
      where: { action: "platform.session.verify", targetId: sessionId },
    })).toBe(1);

    await expect(
      verify(requestHeaders(), code, trustedSource),
    ).rejects.toThrow();

    expect(await db.platformAuditLog.count({
      where: { action: "platform.session.verify", targetId: sessionId },
    })).toBe(1);
    expect(await db.platformSessionAssurance.findUnique({
      where: { sessionId },
    })).toEqual(assurance);

    const current = await auth.api.getSession({ headers: requestHeaders() });
    expect(current?.session.id).toBe(sessionId);
  });

  describe("administrative email verification links", () => {
    async function emailFixture() {
      vi.stubEnv("RESEND_API_KEY", "isolated-email-provider-fixture");
      vi.stubEnv("NOTIFICATION_FROM_EMAIL", "OQOOD <test@example.invalid>");
      emailDelivery.send.mockReset().mockResolvedValue(undefined);

      const email = `${randomUUID()}@example.invalid`;
      const signup = await auth.handler(new Request(
        `${origin}/api/auth/sign-up/email`,
        {
          method: "POST",
          headers: { origin, "content-type": "application/json" },
          body: JSON.stringify({
            name: "Email verification fixture",
            email,
            password: "Isolated-email-fixture-password-2026!",
          }),
        },
      ));
      expect(signup.status).toBe(200);
      expect(emailDelivery.send).not.toHaveBeenCalled();

      const cookies = signup.headers.getSetCookie()
        .map((cookie) => cookie.split(";")[0])
        .join("; ");
      const headers = new Headers({ origin, cookie: cookies });

      const user = await db.user.findUniqueOrThrow({ where: { email } });
      expect(user.emailVerified).toBe(false);

      await auth.api.sendVerificationEmail({
        headers,
        body: { email, callbackURL: "/admin/verify" },
      });
      expect(emailDelivery.send).toHaveBeenCalledTimes(1);

      const message = emailDelivery.send.mock.calls[0][0] as {
        to: string;
        text: string;
      };
      expect(message.to).toBe(email);
      const linkText = message.text
        .split(String.fromCharCode(10))
        .map((line) => line.trim())
        .find((line) =>
          line.startsWith("http://") || line.startsWith("https://"),
        );
      if (!linkText) throw new Error("Missing verification link.");
      const link = new URL(linkText);
      expect(link.origin).toBe(origin);
      expect(link.searchParams.get("token")).toBeTruthy();

      return { user, link };
    }

    it("verifies only the target account without granting administrative access", async () => {
      try {
        const { user, link } = await emailFixture();
        const other = await db.user.create({
          data: {
            name: "Unrelated account",
            email: `${randomUUID()}@example.invalid`,
          },
        });
        const response = await auth.handler(new Request(link));
        expect([200, 302, 303]).toContain(response.status);
        expect(await db.user.findUniqueOrThrow({
          where: { id: user.id },
        })).toMatchObject({ emailVerified: true });
        expect(await db.user.findUniqueOrThrow({
          where: { id: other.id },
        })).toMatchObject({ emailVerified: false });
        expect(await db.platformStaff.findUnique({
          where: { userId: user.id },
        })).toBeNull();
        expect(await db.platformSessionAssurance.count({
          where: { session: { userId: user.id } },
        })).toBe(0);
      } finally {
        vi.unstubAllEnvs();
      }
    });

    it("rejects a malformed verification token", async () => {
      try {
        const { user, link } = await emailFixture();
        link.searchParams.set("token", "invalid-verification-token");
        await auth.handler(new Request(link));
        expect(await db.user.findUniqueOrThrow({
          where: { id: user.id },
        })).toMatchObject({ emailVerified: false });
      } finally {
        vi.unstubAllEnvs();
      }
    });

    it("rejects an expired verification link", async () => {
      try {
        const { user, link } = await emailFixture();
        vi.useFakeTimers({ toFake: ["Date"] });
        vi.setSystemTime(new Date(Date.now() + 2 * 60 * 60_000));
        await auth.handler(new Request(link));
        expect(await db.user.findUniqueOrThrow({
          where: { id: user.id },
        })).toMatchObject({ emailVerified: false });
      } finally {
        vi.useRealTimers();
        vi.unstubAllEnvs();
      }
    });
  });

});
