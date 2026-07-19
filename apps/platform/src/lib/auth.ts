import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

const appUrl = process.env.BETTER_AUTH_URL;

if (!appUrl) {
  throw new Error(
    "BETTER_AUTH_URL is missing. Add it to apps/platform/.env.",
  );
}

export const auth = betterAuth({
  baseURL: appUrl,

  trustedOrigins: [
    appUrl,
    "http://localhost:3000",
    "https://localhost:3000",
  ],

  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
  },
});
