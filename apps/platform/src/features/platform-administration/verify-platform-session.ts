import { randomUUID } from "node:crypto";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import {
  establishPlatformSessionAssurance,
  PlatformVerificationDeniedError,
} from "./establish-session-assurance";

/**
 * Server-side adapter. trustedSource must be resolved by a trusted
 * deployment adapter, not accepted as a form field or forwarding header.
 */
export async function verifyPlatformSession(
  headers: Headers,
  code: string,
  trustedSource: string,
) {
  const appUrl = process.env.BETTER_AUTH_URL;
  const origin = headers.get("origin");
  if (!appUrl || !origin || origin !== new URL(appUrl).origin) {
    throw new PlatformVerificationDeniedError();
  }

  const authenticated = await auth.api.getSession({ headers });
  if (!authenticated?.session.id || !authenticated.user.id) {
    throw new PlatformVerificationDeniedError();
  }

  return establishPlatformSessionAssurance(prisma, {
    userId: authenticated.user.id,
    sessionId: authenticated.session.id,
    code,
    trustedSource,
    requestId: randomUUID(),
  }, async () => {
    const response = await auth.api.verifyTOTP({
      headers,
      body: { code, trustDevice: false },
      asResponse: true,
    });
    return response.ok;
  });
}
