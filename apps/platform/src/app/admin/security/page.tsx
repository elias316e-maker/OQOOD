import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminEnrollmentForm } from "./enrollment-form";
import styles from "../admin.module.css";

export default async function AdminAccountSecurityPage() {
  const requestHeaders = await headers();
  if (process.env.PLATFORM_ADMIN_PORTAL_ENABLED !== "true") notFound();

  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) redirect("/login?callbackURL=%2Fadmin%2Fsecurity");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      isActive: true,
      emailVerified: true,
      twoFactorEnabled: true,
    },
  });
  if (!user?.isActive) notFound();
  if (!user.emailVerified) redirect("/admin/verify");

  return (
    <main className={styles.page} dir="rtl">
      <section className={styles.panel}>
        <h1>أمان الحساب الإداري</h1>
        <p>
          إعداد تطبيق المصادقة لحسابك. إكمال الإعداد لا يمنحك
          عضوية إدارية، ولا يغني عن التحقق الخاص بالدخول إلى الإدارة.
        </p>
        <AdminEnrollmentForm enabled={user.twoFactorEnabled === true} />
        <nav className={styles.links} aria-label="متابعة الدخول الإداري">
          <Link
            className="odsButton odsButton--outline odsButton--md"
            href="/admin/verify"
          >
            متابعة التحقق الإداري
          </Link>
        </nav>
      </section>
    </main>
  );
}
