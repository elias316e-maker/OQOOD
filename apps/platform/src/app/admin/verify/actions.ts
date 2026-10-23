"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { verifyPlatformSession } from "@/features/platform-administration/verify-platform-session";

export type AdminVerificationState = {
  error: string;
};

export async function verifyAdminSessionAction(
  _previous: AdminVerificationState,
  formData: FormData,
): Promise<AdminVerificationState> {
  if (process.env.PLATFORM_ADMIN_PORTAL_ENABLED !== "true") {
    return { error: "بوابة الإدارة غير متاحة حاليًا." };
  }

  const raw = formData.get("code");
  const code = typeof raw === "string" ? raw.trim() : "";
  if (!/^[0-9]{6}$/.test(code)) {
    return { error: "أدخل رمز التحقق المكوّن من ستة أرقام." };
  }

  const requestHeaders = new Headers(await headers());
  try {
    // Conservative deployment-wide limit. Do not trust forwarding
    // headers until a deployment-specific proxy policy is configured.
    await verifyPlatformSession(
      requestHeaders, code, "admin-portal-global-v1",
    );
  } catch {
    return {
      error: "تعذر اعتماد التحقق. تحقق من الرمز وصلاحية حسابك، أو حاول لاحقًا.",
    };
  }

  redirect("/admin");
}
