"use client";

import {
  EmptyState,
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
    <main className="platformContent">
      <EmptyState
          className="dashboardPanel opportunityVisiblePanel"
          tone="danger"
          icon="!"
          title="تعذر عرض بيانات الفرص"
          description="حدث خطأ غير متوقع أثناء تحميل الصفحة. يمكنك إعادة المحاولة دون فقد بياناتك المحفوظة."
          role="alert"
          aria-live="assertive"
          actions={
            <>
              <button
                className="primaryButton compactButton"
                type="button"
                onClick={reset}
              >
                إعادة المحاولة
              </button>

              <Link
                className="secondaryButton compactButton"
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
