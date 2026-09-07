"use client";

import {
  useEffect,
} from "react";

import Link from "next/link";

import {
  EmptyState,
} from "@oqood/design-system";

import styles from "./documents.module.css";

type DocumentsErrorProps = {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
};

export default function DocumentsError({
  error,
  reset,
}: DocumentsErrorProps) {
  useEffect(() => {
    console.error(
      "Documents route rendering failed.",
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
        title="تعذر تحميل مركز المستندات"
        description="حدث خطأ أثناء تحميل المستندات. يمكنك إعادة المحاولة دون التأثير على الملفات المحفوظة."
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
