"use client";

import {
  useEffect,
} from "react";

import Link from "next/link";

import {
  EmptyState,
} from "@oqood/design-system";

import styles from "./reports.module.css";

type ReportsErrorProps = {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
};

export default function ReportsError({
  error,
  reset,
}: ReportsErrorProps) {
  useEffect(() => {
    console.error(
      "Reports route rendering failed.",
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
        title="تعذر تحميل التقارير والتحليلات"
        description="حدث خطأ أثناء تجهيز المؤشرات المالية والتشغيلية. يمكنك إعادة المحاولة دون التأثير على البيانات المحفوظة."
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
