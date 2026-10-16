"use client";

import styles from "./page.module.css";

import {
  Button,
  EmptyState,
  WorkspaceHeader,
} from "@oqood/design-system";


import { useEffect } from "react";

import Link from "next/link";

type OpportunitiesErrorProps = {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
};

export default function OpportunitiesError({
  error,
  reset,
}: OpportunitiesErrorProps) {
  useEffect(() => {
    console.error(
      "Opportunity route rendering failed.",
      {
        name: error.name,
        message: error.message,
        digest: error.digest,
      },
    );
  }, [error]);

  return (
    <main className={styles.page}>
      <WorkspaceHeader title="المنافسات" eyebrow="إدارة المنافسات" />
      <EmptyState
          tone="danger"
          icon="!"
          title="تعذر عرض بيانات المنافسات"
          description="حدث خطأ غير متوقع أثناء تحميل الصفحة. يمكنك إعادة المحاولة دون فقد بياناتك المحفوظة."
          role="alert"
          aria-live="assertive"
          actions={
            <>
              <Button onClick={reset}>
                إعادة المحاولة
              </Button>

              <Link
                className="odsButton odsButton--ghost odsButton--md"
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
