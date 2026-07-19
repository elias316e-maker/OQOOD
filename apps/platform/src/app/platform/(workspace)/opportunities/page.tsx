import Link from "next/link";

const opportunities = [
  {
    number: "RFQ-2026-0015",
    title: "توريد أنابيب فولاذية لمشروع صناعي",
    type: "طلب عرض سعر",
    project: "مشروع توسعة المنشأة",
    closing: "18 يوليو 2026",
    offers: 8,
    value: "1,850,000 ر.س",
    status: "مفتوح",
    statusClass: "success",
  },
  {
    number: "RFP-2026-0007",
    title: "خدمات تشغيل وصيانة المنشأة",
    type: "طلب تقديم عرض",
    project: "مشروع التشغيل والصيانة",
    closing: "14 يوليو 2026",
    offers: 5,
    value: "4,200,000 ر.س",
    status: "تحت التقييم",
    statusClass: "warning",
  },
  {
    number: "RFQ-2026-0014",
    title: "تأجير معدات ثقيلة لمدة 6 أشهر",
    type: "طلب عرض سعر",
    project: "مشروع البنية التحتية",
    closing: "غير محدد",
    offers: 0,
    value: "650,000 ر.س",
    status: "مسودة",
    statusClass: "neutral",
  },
  {
    number: "TND-2026-0003",
    title: "تنفيذ أعمال تشجير وري متكاملة",
    type: "منافسة",
    project: "مشروع تطوير المواقع",
    closing: "22 يوليو 2026",
    offers: 12,
    value: "5,600,000 ر.س",
    status: "مفتوح",
    statusClass: "success",
  },
];

export default function OpportunitiesPage() {
  return (
    <main className="platformContent">
      <section className="listPageHeader">
        <div>
          <span className="pageEyebrow">إدارة الفرص</span>
          <h1>الفرص والمنافسات</h1>
          <p>
            أنشئ وتابع طلبات الأسعار وطلبات العروض والمنافسات من مكان واحد.
          </p>
        </div>

        <Link
          className="primaryButton compactButton"
          href="/platform/opportunities/new"
        >
          + إنشاء فرصة جديدة
        </Link>
      </section>

      <section className="listSummaryCards">
        <article>
          <span>إجمالي الفرص</span>
          <strong>24</strong>
          <small>منذ بداية السنة</small>
        </article>

        <article>
          <span>الفرص المفتوحة</span>
          <strong>12</strong>
          <small className="positive">+3 هذا الأسبوع</small>
        </article>

        <article>
          <span>تحت التقييم</span>
          <strong>7</strong>
          <small>تحتاج متابعة</small>
        </article>

        <article>
          <span>تمت الترسية</span>
          <strong>5</strong>
          <small>بقيمة 11.2 مليون ر.س</small>
        </article>
      </section>

      <section className="dashboardPanel opportunityListPanel">
        <div className="opportunityToolbar">
          <div className="filterTabs">
            <button className="active" type="button">
              الكل
            </button>
            <button type="button">مفتوحة</button>
            <button type="button">مسودات</button>
            <button type="button">تقييم</button>
            <button type="button">مرسّاة</button>
          </div>

          <div className="toolbarActions">
            <input type="search" placeholder="ابحث برقم أو عنوان الفرصة..." />
            <button type="button">تصفية</button>
            <button type="button">تصدير</button>
          </div>
        </div>

        <div className="dataTableWrapper">
          <table className="dataTable">
            <thead>
              <tr>
                <th>رقم الفرصة</th>
                <th>العنوان</th>
                <th>النوع</th>
                <th>المشروع</th>
                <th>الإغلاق</th>
                <th>العروض</th>
                <th>القيمة التقديرية</th>
                <th>الحالة</th>
                <th />
              </tr>
            </thead>

            <tbody>
              {opportunities.map((opportunity) => (
                <tr key={opportunity.number}>
                  <td>
                    <Link
                      className="tablePrimaryLink"
                      href={`/platform/opportunities/${opportunity.number}`}
                    >
                      {opportunity.number}
                    </Link>
                  </td>
                  <td>
                    <strong>{opportunity.title}</strong>
                  </td>
                  <td>{opportunity.type}</td>
                  <td>{opportunity.project}</td>
                  <td>{opportunity.closing}</td>
                  <td>{opportunity.offers}</td>
                  <td>{opportunity.value}</td>
                  <td>
                    <span className={`status ${opportunity.statusClass}`}>
                      {opportunity.status}
                    </span>
                  </td>
                  <td>
                    <button className="tableActionButton" type="button">
                      ⋮
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
