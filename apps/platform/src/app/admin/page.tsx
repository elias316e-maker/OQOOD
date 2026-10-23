import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import {
  PlatformAccessDeniedError,
  requirePlatformPermission,
} from "@/features/platform-administration/require-platform-permission";
import { PlatformPermissions } from "@/features/platform-administration/permissions";

import styles from "./admin.module.css";

export default async function PlatformAdministrationPage() {
  // Evaluate availability and authorization for each request.
  await headers();
  if (process.env.PLATFORM_ADMIN_PORTAL_ENABLED !== "true") notFound();
  try {
    await requirePlatformPermission(PlatformPermissions.portalAccess);
  } catch (error) {
    if (error instanceof PlatformAccessDeniedError) {
      redirect("/admin/verify");
    }
    throw error;
  }

  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <h1>إدارة منصة عقود</h1>
        <p>تم التحقق من صلاحية وصولك الإداري لهذه الجلسة.</p>
        <p>
          أقسام إدارة الموظفين والشركات والاشتراكات ستُضاف
          وفق صلاحيات كل دور.
        </p>
        <nav className={styles.links} aria-label="التنقل الإداري">
          <Link
            className="odsButton odsButton--outline odsButton--md"
            href="/admin/staff"
          >
            موظفو المنصة والصلاحيات
          </Link>
          <Link
            className="odsButton odsButton--outline odsButton--md"
            href="/admin/verify"
          >
            إعادة التحقق
          </Link>
          <Link
            className="odsButton odsButton--ghost odsButton--md"
            href="/platform"
          >
            مساحة العمل
          </Link>
        </nav>
      </section>
    </main>
  );
}
