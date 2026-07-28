import Link from "next/link";

import { ProjectCreateForm } from "@/features/projects/project-create-form";
import { hasPermission, Permissions } from "@/lib/permissions";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

import styles from "../projects.module.css";

export default async function NewProjectPage() {
  const context = await requireCurrentWorkspace();
  if (!hasPermission(context, Permissions.workspace.update)) {
    return <main className={styles.page}><p className={styles.empty}>لا تملك صلاحية إنشاء المشاريع.</p></main>;
  }
  return <main className={styles.page}>
    <header className={styles.header}><div><span>إضافة مشروع للمحفظة</span><h1>مشروع جديد</h1><p>عرّف المشروع وميزانيته وجدوله الزمني قبل ربط العمليات به.</p></div><Link href="/platform/projects">العودة للمشاريع</Link></header>
    <ProjectCreateForm defaultCurrency={context.workspace.defaultCurrency} />
  </main>;
}
