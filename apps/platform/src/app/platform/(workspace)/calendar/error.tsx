"use client";

import {
  useEffect,
} from "react";

import Link from "next/link";

import {
  EmptyState,
} from "@oqood/design-system";

import styles from "./calendar.module.css";

type CalendarErrorProps = {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
};

export default function CalendarError({
  error,
  reset,
}: CalendarErrorProps) {
  useEffect(() => {
    console.error(
      "Calendar route rendering failed.",
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
        className={styles.routeError}
        tone="danger"
        icon="!"
        title="تعذر تحميل التقويم والمهام"
        description="حدث خطأ أثناء تحميل المواعيد التشغيلية. يمكنك إعادة المحاولة دون التأثير على بيانات المشتريات أو العقود."
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
