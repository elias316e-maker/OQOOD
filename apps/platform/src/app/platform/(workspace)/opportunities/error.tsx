"use client";

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
      <section
        className="dashboardPanel opportunityVisiblePanel"
        role="alert"
        aria-live="assertive"
      >
        <div className="emptyState">
          <span
            className="pageEyebrow"
            aria-hidden="true"
          >
            خطأ في النظام
          </span>

          <h1>تعذر عرض بيانات الفرص</h1>

          <p>
            حدث خطأ غير متوقع أثناء تحميل الصفحة.
            يمكنك إعادة المحاولة دون فقد بياناتك المحفوظة.
          </p>

          <div className="commandHeaderActions">
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
          </div>
        </div>
      </section>
    </main>
  );
}
