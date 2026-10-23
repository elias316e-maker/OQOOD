import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { AdminVerificationForm } from "./verification-form";
import { EmailVerificationForm } from "./email-verification-form";
import styles from "../admin.module.css";

export default async function AdminVerificationPage() {
  const requestHeaders = await headers();
  if (process.env.PLATFORM_ADMIN_PORTAL_ENABLED !== "true") notFound();

  const session = await auth.api.getSession({
    headers: requestHeaders,
  });
  if (!session) redirect("/login?callbackURL=%2Fadmin%2Fverify");

  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <h1>التحقق لدخول إدارة المنصة</h1>
        <p>
          أدخل رمز تطبيق المصادقة الخاص بحسابك.
          يتطلب الدخول عضوية إدارية نشطة وبريدًا موثقًا.
        </p>
        {!session.user.emailVerified ? (
          <EmailVerificationForm />
        ) : (
          <AdminVerificationForm />
        )}
        <p>
          إذا لم تكن قد أعددت تطبيق المصادقة، أكمل إعداد أمان
          الحساب قبل المتابعة.
        </p>
        <Link
          className="odsButton odsButton--ghost odsButton--md"
          href="/admin/security"
        >
          إعدادات الحساب
        </Link>
      </section>
    </main>
  );
}
