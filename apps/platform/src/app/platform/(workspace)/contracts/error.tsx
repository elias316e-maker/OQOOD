"use client";

import {
  useEffect,
} from "react";

import Link from "next/link";

import {
  EmptyState,
} from "@oqood/design-system";

import styles from "./contracts.module.css";

type ContractsErrorProps = {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
};

export default function ContractsError({
  error,
  reset,
}: ContractsErrorProps) {
  useEffect(() => {
    console.error(
      "Contracts route rendering failed.",
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
        title="تعذر عرض بيانات العقود"
        description="حدث خطأ غير متوقع أثناء تحميل العقود. يمكنك إعادة المحاولة دون فقد البيانات المحفوظة."
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
