"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  reservePlatformVerificationAttempt,
} from "@/features/platform-administration/verification-store";

export type EmailVerificationState = {
  success: boolean;
  message: string;
};

export async function sendAdminEmailVerificationAction(
  _previous: EmailVerificationState,
  _data: FormData,
): Promise<EmailVerificationState> {
  void _previous;
  void _data;
  if (process.env.PLATFORM_ADMIN_PORTAL_ENABLED !== "true") {
    return { success: false, message: "بوابة الإدارة غير متاحة حاليًا." };
  }

  const requestHeaders = await headers();
  const appUrl = process.env.BETTER_AUTH_URL;
  if (!appUrl || requestHeaders.get("origin") !== new URL(appUrl).origin) {
    return { success: false, message: "تعذر التحقق من مصدر الطلب." };
  }

  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) {
    return { success: false, message: "سجّل الدخول مجددًا قبل طلب التوثيق." };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, emailVerified: true, isActive: true },
  });
  if (!user?.isActive) {
    return { success: false, message: "الحساب غير متاح لهذا الإجراء." };
  }
  if (user.emailVerified) {
    return { success: true, message: "بريد الحساب موثّق بالفعل. حدّث الصفحة." };
  }
  if (!process.env.RESEND_API_KEY || !process.env.NOTIFICATION_FROM_EMAIL) {
    return {
      success: false,
      message: "إرسال بريد التوثيق غير متاح حاليًا. تواصل مع مشغّل المنصة.",
    };
  }

  try {
    // Separate counters from administrative TOTP verification.
    await reservePlatformVerificationAttempt(
      prisma,
      `email-verification:${user.id}`,
      "admin-email-verification-global-v1",
    );

    await auth.api.sendVerificationEmail({
      headers: requestHeaders,
      body: {
        email: user.email,
        callbackURL: "/admin/verify",
      },
    });
  } catch {
    return {
      success: false,
      message: "تعذر إرسال الرابط أو تم تجاوز عدد المحاولات. حاول لاحقًا.",
    };
  }

  return {
    success: true,
    message: "أُرسل رابط التوثيق إلى بريد حسابك. افتحه خلال ساعة، ثم عُد إلى هذه الصفحة.",
  };
}
