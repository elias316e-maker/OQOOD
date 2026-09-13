"use client";

import {
  useEffect,
} from "react";

import Link from "next/link";

import {
  EmptyState,
} from "@oqood/design-system";

import styles from "./settings.module.css";

type SettingsErrorProps = {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
};

export default function SettingsError({
  error,
  reset,
}: SettingsErrorProps) {
  useEffect(() => {
    console.error(
      "Settings route rendering failed.",
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
        title="تعذر تحميل الإعدادات والفريق"
        description="حدث خطأ أثناء تجهيز إعدادات مساحة العمل أو بيانات الفريق. يمكنك إعادة المحاولة دون التأثير على البيانات المحفوظة."
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
