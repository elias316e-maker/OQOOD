"use client";

import { createAuthClient } from "better-auth/react";
import { twoFactorPathFromSearch } from "./auth-return-path";
import { twoFactorClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
  plugins: [
    twoFactorClient({
      onTwoFactorRedirect() {
        if (typeof window !== "undefined") {
          window.location.assign(
            twoFactorPathFromSearch(window.location.search),
          );
        }
      },
    }),
  ],
});
