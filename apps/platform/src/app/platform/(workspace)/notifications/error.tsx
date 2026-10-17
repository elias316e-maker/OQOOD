"use client";

import {
  useEffect,
} from "react";

import Link from "next/link";

import {
  EmptyState,
} from "@oqood/design-system";

import styles from "./notifications.module.css";

type NotificationsErrorProps = {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
};

export default function NotificationsError({
  error,
  reset,
}: NotificationsErrorProps) {
  useEffect(() => {
    console.error(
      "Notifications route rendering failed.",
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
        title="تعذر تحميل مركز الإشعارات"
        description="حدث خطأ أثناء تحميل الإشعارات. يمكنك إعادة المحاولة دون التأثير على بيانات المنصة."
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
