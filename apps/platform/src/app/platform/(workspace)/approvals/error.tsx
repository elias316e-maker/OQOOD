"use client";

import {
  useEffect,
} from "react";

import Link from "next/link";

import {
  EmptyState,
} from "@oqood/design-system";

import styles from "./approvals.module.css";

type ApprovalsErrorProps = {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
};

export default function ApprovalsError({
  error,
  reset,
}: ApprovalsErrorProps) {
  useEffect(() => {
    console.error(
      "Approvals route rendering failed.",
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
        title="تعذر تحميل مركز الموافقات"
        description="حدث خطأ أثناء تحميل القرارات المعلّقة. يمكنك إعادة المحاولة دون التأثير على الطلبات أو العقود المحفوظة."
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
