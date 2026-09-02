"use client";

import {
  useEffect,
} from "react";

import Link from "next/link";

import {
  EmptyState,
} from "@oqood/design-system";

import styles from "./page.module.css";

type ProcurementErrorProps = {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
};

export default function ProcurementError({
  error,
  reset,
}: ProcurementErrorProps) {
  useEffect(() => {
    console.error(
      "Procurement route rendering failed.",
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
        title="تعذر عرض طلبات المشتريات"
        description="حدث خطأ غير متوقع أثناء تحميل الصفحة. يمكنك إعادة المحاولة دون فقد البيانات المحفوظة."
        role="alert"
        aria-live="assertive"
        actions={
          <>
            <button
              className={styles.filterButton}
              onClick={reset}
              type="button"
            >
              إعادة المحاولة
            </button>

            <Link
              className={styles.resetButton}
              href="/platform"
            >
              العودة للرئيسية
            </Link>
          </>
        }
      />
    </main>
  );
}
