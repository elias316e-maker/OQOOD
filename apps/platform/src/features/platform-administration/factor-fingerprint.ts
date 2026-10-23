import { createHmac } from "node:crypto";

export function factorFingerprint(
  factorId: string,
  encryptedSecret: string,
): string {
  const key = process.env.BETTER_AUTH_SECRET;
  if (!key || key.length < 32) {
    throw new Error("Administrative access requires a configured authentication secret.");
  }

  return createHmac("sha256", key)
    .update(JSON.stringify([
      "oqood-platform-factor-v1",
      factorId,
      encryptedSecret,
    ]))
    .digest("hex");
}
