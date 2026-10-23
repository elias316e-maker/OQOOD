import { createHmac } from "node:crypto";
import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import { twoFactor } from "better-auth/plugins";
import { describe, expect, it } from "vitest";

// Test fixture only: generate a TOTP for the isolated test account.
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

describe("Better Auth administrative TOTP compatibility", () => {
  it("verifies an enrolled factor with an existing session and exposes replay behavior", async () => {
    const database = {
      user: [],
      session: [],
      account: [],
      verification: [],
      twoFactor: [],
    };
    const auth = betterAuth({
      database: memoryAdapter(database),
      baseURL: "http://localhost:3000",
      secret: "isolated-test-secret-at-least-thirty-two-characters",
      emailAndPassword: { enabled: true },
      rateLimit: { enabled: false },
      plugins: [
        twoFactor({
          issuer: "OQOOD isolated test",
          accountLockout: {
            enabled: true,
            maxFailedAttempts: 5,
            durationSeconds: 900,
          },
        }),
      ],
    });

    const jar = new Map<string, string>();

    async function request(path: string, body?: Record<string, unknown>) {
      const headers = new Headers({
        origin: "http://localhost:3000",
        "content-type": "application/json",
      });
      if (jar.size) {
        headers.set(
          "cookie",
          [...jar].map(([name, value]) => `${name}=${value}`).join("; "),
        );
      }
      const response = await auth.handler(new Request(
        `http://localhost:3000/api/auth${path}`,
        {
          method: body ? "POST" : "GET",
          headers,
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

    const password = "Isolated-fixture-password-2026!";
    const signup = await request("/sign-up/email", {
      name: "Isolated administrator fixture",
      email: "admin-fixture@example.test",
      password,
    });
    expect(signup.status).toBe(200);

    const enable = await request("/two-factor/enable", { password });
    expect(enable.status).toBe(200);
    const enrollment = await enable.json() as { totpURI: string };
    const secret = new URL(enrollment.totpURI).searchParams.get("secret");
    expect(secret).toBeTruthy();
    if (!secret) throw new Error("Missing fixture factor.");

    const enrolled = await request("/two-factor/verify-totp", {
      code: fixtureTotp(secret),
      trustDevice: false,
    });
    expect(enrolled.status).toBe(200);

    const current = await request("/get-session");
    expect(current.status).toBe(200);
    const before = await current.json() as {
      session: { id: string };
      user: { twoFactorEnabled: boolean };
    };
    expect(before.user.twoFactorEnabled).toBe(true);

    const rejected = await request("/two-factor/verify-totp", {
      code: "invalid-fixture-code",
      trustDevice: false,
    });
    expect(rejected.ok).toBe(false);

    const code = fixtureTotp(secret);
    const accepted = await request("/two-factor/verify-totp", {
      code,
      trustDevice: false,
    });
    expect(accepted.status).toBe(200);

    // Characterize provider behavior, not desired admin replay policy.
    // The administration layer must independently reject reuse.
    const repeated = await request("/two-factor/verify-totp", {
      code,
      trustDevice: false,
    });
    expect(repeated.status).toBe(200);

    const afterResponse = await request("/get-session");
    const after = await afterResponse.json() as {
      session: { id: string };
    };
    expect(after.session.id).toBe(before.session.id);
  });
});
