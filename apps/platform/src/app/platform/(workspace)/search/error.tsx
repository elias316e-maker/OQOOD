"use client";

import {
  useEffect,
} from "react";

import Link from "next/link";

import {
  EmptyState,
} from "@oqood/design-system";

import styles from "./search.module.css";

type SearchErrorProps = {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
};

export default function SearchError({
  error,
  reset,
}: SearchErrorProps) {
  useEffect(() => {
    console.error(
      "Search route rendering failed.",
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
        title="تعذر تحميل البحث الشامل"
        description="حدث خطأ أثناء تجهيز نتائج البحث. يمكنك إعادة المحاولة دون التأثير على بيانات مساحة العمل."
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
