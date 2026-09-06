"use client";

import {
  useEffect,
} from "react";

import Link from "next/link";

import {
  EmptyState,
} from "@oqood/design-system";

import styles from "./projects.module.css";

type ProjectsErrorProps = {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
};

export default function ProjectsError({
  error,
  reset,
}: ProjectsErrorProps) {
  useEffect(() => {
    console.error(
      "Projects route rendering failed.",
      {
        name: error.name,
        message: error.message,
        digest: error.digest,
      },
    );
  }, [error]);

  return (
    <main className={styles.page}>
      <EmptyState
        className={styles.panel}
        tone="danger"
        icon="!"
        title="تعذر عرض بيانات المشاريع"
        description="حدث خطأ غير متوقع أثناء تحميل محفظة المشاريع. يمكنك إعادة المحاولة دون فقد البيانات المحفوظة."
        role="alert"
        aria-live="assertive"
        actions={
          <>
            <button
              className={`${styles.stateAction} ${styles.stateActionPrimary}`}
              onClick={reset}
              type="button"
            >
              إعادة المحاولة
            </button>

            <Link
              className={styles.stateAction}
              href="/platform"
            >
              العودة إلى لوحة التحكم
            </Link>
          </>
        }
      />
    </main>
  );
}
