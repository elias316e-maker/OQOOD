import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { twoFactor } from "better-auth/plugins";
import { prisma } from "@/lib/prisma";
import { sendAuthenticationEmail } from "@/lib/auth-email";

const appUrl = process.env.BETTER_AUTH_URL;
const authSecret = process.env.BETTER_AUTH_SECRET;

if (!appUrl) {
  throw new Error(
    "BETTER_AUTH_URL is missing. Add it to apps/platform/.env.",
  );
}

if (process.env.NODE_ENV === "production" && (!authSecret || authSecret.length < 32)) {
  throw new Error(
    "BETTER_AUTH_SECRET must contain at least 32 characters in production.",
  );
}

const configuredOrigins = (process.env.APP_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const auth = betterAuth({
  baseURL: appUrl,
  secret: authSecret,

  trustedOrigins: [
    appUrl,
    ...configuredOrigins,
    "http://localhost:3000",
    "https://localhost:3000",
  ],

  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: 60 * 60,
    sendResetPassword: async ({ user, url }) => {
      void sendAuthenticationEmail({
        to: user.email,
        subject: "إعادة تعيين كلمة المرور في OQOOD",
        text: `استخدم الرابط التالي خلال ساعة واحدة لإعادة تعيين كلمة المرور:\n\n${url}`,
      });
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 12,
    freshAge: 60 * 10,
  },

  plugins: [
    twoFactor({
      issuer: "OQOOD",
      accountLockout: {
        enabled: true,
        maxFailedAttempts: 5,
        durationSeconds: 15 * 60,
      },
    }),
  ],
});
