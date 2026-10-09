"use client";

import {
  useEffect,
} from "react";

import Link from "next/link";

import {
  EmptyState,
} from "@oqood/design-system";

import styles from "./partners.module.css";

type PartnersErrorProps = {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
};

export default function PartnersError({
  error,
  reset,
}: PartnersErrorProps) {
  useEffect(() => {
    console.error(
      "Partners route rendering failed.",
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
        title="تعذر تحميل دليل شركاء الأعمال"
        description="حدث خطأ أثناء تحميل بيانات الموردين والشركاء. يمكنك إعادة المحاولة دون التأثير على السجلات المحفوظة."
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
