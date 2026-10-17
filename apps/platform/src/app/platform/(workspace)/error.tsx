"use client";

import {
  useEffect,
} from "react";

import Link from "next/link";

import {
  EmptyState,
} from "@oqood/design-system";

import styles from "./page.module.css";

type WorkspaceErrorProps = {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
};

export default function WorkspaceError({
  error,
  reset,
}: WorkspaceErrorProps) {
  useEffect(() => {
    console.error(
      "Workspace route rendering failed.",
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
        className={styles.routeState}
        tone="danger"
        icon="!"
        title="تعذر تحميل مساحة العمل"
        description="حدث خطأ أثناء تجهيز البيانات التشغيلية. يمكنك إعادة المحاولة دون التأثير على السجلات المحفوظة."
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
              className={
                styles.stateAction
              }
              href="/platform/search"
            >
              فتح البحث الشامل
            </Link>
          </>
        }
      />
    </main>
  );
}
