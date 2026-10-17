"use client";

import {
  useEffect,
} from "react";

import Link from "next/link";

import {
  EmptyState,
} from "@oqood/design-system";

import styles from "./partner-scorecard.module.css";

type PartnerDetailsErrorProps = {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
};

export default function PartnerDetailsError({
  error,
  reset,
}: PartnerDetailsErrorProps) {
  useEffect(() => {
    console.error(
      "Partner details route rendering failed.",
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
        title="تعذر تحميل بطاقة أداء الشريك"
        description="حدث خطأ أثناء تحميل العقود والتقييمات والمؤشرات المرتبطة بالشريك. يمكنك إعادة المحاولة دون التأثير على البيانات المحفوظة."
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
              href="/platform/partners"
            >
              العودة إلى دليل الشركاء
            </Link>
          </>
        }
      />
    </main>
  );
}
