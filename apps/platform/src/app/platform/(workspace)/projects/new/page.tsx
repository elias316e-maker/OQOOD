import Link from "next/link";

import {
  EmptyState,
  WorkspaceHeader,
} from "@oqood/design-system";

import {
  ProjectCreateForm,
} from "@/features/projects/project-create-form";

import {
  hasPermission,
  Permissions,
} from "@/lib/permissions";

import {
  requireCurrentWorkspace,
} from "@/lib/workspace-context";

import styles from "../projects.module.css";

export default async function NewProjectPage() {
  const context =
    await requireCurrentWorkspace();

  const canCreate = hasPermission(
    context,
    Permissions.workspace.update,
  );

  if (!canCreate) {
    return (
      <main className={styles.page}>
        <EmptyState
          className={styles.panel}
          tone="warning"
          icon="!"
          title="لا تملك صلاحية إنشاء المشاريع"
          description="تواصل مع مسؤول مساحة العمل للحصول على صلاحية إنشاء المشاريع وإدارتها."
          role="alert"
          aria-live="polite"
          actions={
            <Link
              className={styles.backButton}
              href="/platform/projects"
            >
              العودة إلى المشاريع
            </Link>
          }
        />
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <WorkspaceHeader
        className={styles.header}
        eyebrow="إضافة مشروع للمحفظة"
        title="مشروع جديد"
        description="عرّف المشروع وميزانيته وجدوله الزمني قبل ربط المشتريات والمنافسات والعقود به."
        actions={
          <Link
            className={styles.backButton}
            href="/platform/projects"
          >
            العودة إلى المشاريع
          </Link>
        }
      />

      <ProjectCreateForm
        defaultCurrency={
          context.workspace.defaultCurrency
        }
      />
    </main>
  );
}
