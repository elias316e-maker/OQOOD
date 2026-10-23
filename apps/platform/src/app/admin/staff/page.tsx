import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import {
  PlatformAccessDeniedError,
  requirePlatformPermission,
} from "@/features/platform-administration/require-platform-permission";
import { PlatformPermissions } from "@/features/platform-administration/permissions";

import styles from "../admin.module.css";
import local from "./page.module.css";
import { StaffMembershipForm } from "./staff-membership-form";
import { CreateStaffForm } from "./create-staff-form";

const roleLabels = {
  PLATFORM_ADMIN: "مدير المنصة",
  SUPPORT: "الدعم",
  BILLING: "الفوترة",
  AUDITOR: "المراجع",
} as const;

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export default async function PlatformStaffPage({ searchParams }: Props) {
  await headers();
  if (process.env.PLATFORM_ADMIN_PORTAL_ENABLED !== "true") notFound();

  try {
    await requirePlatformPermission(PlatformPermissions.staffRead);
  } catch (error) {
    if (error instanceof PlatformAccessDeniedError) {
      redirect("/admin/verify");
    }
    throw error;
  }

  const query = await searchParams;
  const requested = Number(query.page ?? "1");
  const currentPage = Number.isInteger(requested) && requested >= 1
    ? Math.min(requested, 10_000)
    : 1;
  const pageSize = 25;

  const members = await prisma.platformStaff.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: (currentPage - 1) * pageSize,
    take: pageSize + 1,
    select: {
      id: true,
      role: true,
      status: true,
      authorizationVersion: true,
      user: {
        select: {
          name: true,
          email: true,
          isActive: true,
        },
      },
    },
  });
  const hasNext = members.length > pageSize;
  const visible = members.slice(0, pageSize);

  return (
    <main className={styles.page} dir="rtl">
      <section className={`${styles.panel} ${local.panel}`}>
        <header>
          <h1>موظفو إدارة المنصة</h1>
          <p>الأدوار الإدارية مستقلة عن عضوية الشركات ومساحات العمل.</p>
          <Link className="odsButton odsButton--ghost odsButton--md" href="/admin">
            العودة إلى إدارة المنصة
          </Link>
        </header>

        <CreateStaffForm />

        {visible.length ? (
          <div className={local.viewport}>
            <table className={local.table}>
              <caption className={local.caption}>
                الموظفون الإداريون — الصفحة {currentPage}
              </caption>
              <thead>
                <tr>
                  <th scope="col">الاسم</th>
                  <th scope="col">البريد الإلكتروني</th>
                  <th scope="col">الدور</th>
                  <th scope="col">العضوية الإدارية</th>
                  <th scope="col">الحساب</th>
                  <th scope="col">تعديل العضوية</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((member) => (
                  <tr key={member.id}>
                    <td>{member.user.name}</td>
                    <td><bdi>{member.user.email}</bdi></td>
                    <td>{roleLabels[member.role]}</td>
                    <td>{member.status === "ACTIVE" ? "نشطة" : "معلّقة"}</td>
                    <td>{member.user.isActive ? "نشط" : "معطّل"}</td>
                    <td>
                      <StaffMembershipForm
                        staffId={member.id}
                        name={member.user.name}
                        role={member.role}
                        status={member.status}
                        authorizationVersion={member.authorizationVersion}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p role="status">لا توجد عضويات إدارية في هذه الصفحة.</p>
        )}

        <nav className={styles.links} aria-label="صفحات الموظفين">
          {currentPage > 1 && (
            <Link
              className="odsButton odsButton--outline odsButton--md"
              href={`/admin/staff?page=${currentPage - 1}`}
            >
              السابق
            </Link>
          )}
          {hasNext && currentPage < 10_000 && (
            <Link
              className="odsButton odsButton--outline odsButton--md"
              href={`/admin/staff?page=${currentPage + 1}`}
            >
              التالي
            </Link>
          )}
        </nav>
      </section>
    </main>
  );
}
