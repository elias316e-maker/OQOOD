import Link from "next/link";

export default function OpportunityNotFound() {
  return (
    <main className="platformContent">
      <section className="dashboardPanel">
        <div className="emptyState">
          <h1>الفرصة غير موجودة</h1>

          <p>
            قد تكون الفرصة حُذفت أو لم تعد متاحة
            داخل مساحة العمل الحالية.
          </p>

          <Link
            className="primaryButton compactButton"
            href="/platform/opportunities"
          >
            العودة إلى قائمة الفرص
          </Link>
        </div>
      </section>
    </main>
  );
}
