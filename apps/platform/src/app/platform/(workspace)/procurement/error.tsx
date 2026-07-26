"use client";

import {
  useEffect,
} from "react";

import Link from "next/link";

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
      <section
        className={styles.panel}
        role="alert"
      >
        <div className={styles.error}>
          <div>
            <span className={styles.eyebrow}>
              خطأ في النظام
            </span>
            <h1>تعذر عرض طلبات المشتريات</h1>
            <p>
              حدث خطأ غير متوقع أثناء تحميل الصفحة. يمكنك
              إعادة المحاولة دون فقد البيانات المحفوظة.
            </p>
            <div className={styles.filterActions}>
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
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

