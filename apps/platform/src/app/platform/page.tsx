import Link from "next/link";

const metrics = [
  {
    label: "المنافسات النشطة",
    value: "12",
    detail: "+3 هذا الأسبوع",
    tone: "positive",
  },
  {
    label: "العروض المستلمة",
    value: "47",
    detail: "8 تحتاج مراجعة",
    tone: "neutral",
  },
  {
    label: "قيمة العقود النشطة",
    value: "18.4 م",
    detail: "ريال سعودي",
    tone: "neutral",
  },
  {
    label: "الوفورات المحققة",
    value: "8.2%",
    detail: "+1.4% عن الشهر الماضي",
    tone: "positive",
  },
];

const opportunities = [
  {
    number: "RFQ-2026-0015",
    title: "توريد أنابيب فولاذية لمشروع صناعي",
    closing: "يغلق خلال يومين",
    offers: "8 عروض",
    status: "مفتوح",
    statusClass: "success",
  },
  {
    number: "RFP-2026-0007",
    title: "خدمات تشغيل وصيانة المنشأة",
    closing: "التقييم الفني",
    offers: "5 عروض",
    status: "تقييم",
    statusClass: "warning",
  },
  {
    number: "RFQ-2026-0014",
    title: "تأجير معدات ثقيلة لمدة 6 أشهر",
    closing: "غير منشور",
    offers: "لا توجد عروض",
    status: "مسودة",
    statusClass: "neutral",
  },
];

const tasks = [
  {
    title: "اعتماد الترسية النهائية",
    project: "مشروع التشجير والري",
    due: "اليوم",
  },
  {
    title: "مراجعة التقييم الفني",
    project: "خدمات التشغيل والصيانة",
    due: "غدًا",
  },
  {
    title: "تحديث وثائق مورد",
    project: "تنتهي الشهادة خلال 6 أيام",
    due: "قريبًا",
  },
];

export default function PlatformPage() {
  return (
    <main className="platformContent">
      <section className="commandHeader">
        <div>
          <span className="pageEyebrow">مركز القيادة</span>
          <h1>صباح الخير، علي</h1>
          <p>لديك خمس إجراءات تحتاج إلى اهتمامك اليوم.</p>
        </div>

        <div className="commandHeaderActions">
          <button className="secondaryButton compactButton" type="button">
            تخصيص المركز
          </button>

          <Link
            className="primaryButton compactButton"
            href="/platform/opportunities/new"
          >
            إنشاء فرصة جديدة
          </Link>
        </div>
      </section>

      <section className="platformMetrics">
        {metrics.map((metric) => (
          <article className="platformMetricCard" key={metric.label}>
            <div className="metricCardHeader">
              <span>{metric.label}</span>
              <button type="button">•••</button>
            </div>

            <strong>{metric.value}</strong>

            <small className={metric.tone}>{metric.detail}</small>
          </article>
        ))}
      </section>

      <section className="platformDashboardGrid">
        <div className="dashboardMainColumn">
          <article className="dashboardPanel">
            <div className="dashboardPanelHeader">
              <div>
                <h2>مسار المشتريات</h2>
                <p>ملخص العمليات خلال آخر 30 يومًا</p>
              </div>

              <select defaultValue="30">
                <option value="30">آخر 30 يومًا</option>
                <option value="90">آخر 90 يومًا</option>
              </select>
            </div>

            <div className="procurementPipeline">
              <div>
                <span>طلبات جديدة</span>
                <strong>18</strong>
              </div>
              <div>
                <span>منشورة</span>
                <strong>12</strong>
              </div>
              <div>
                <span>تحت التقييم</span>
                <strong>7</strong>
              </div>
              <div>
                <span>تفاوض</span>
                <strong>4</strong>
              </div>
              <div>
                <span>تمت الترسية</span>
                <strong>3</strong>
              </div>
            </div>
          </article>

          <article className="dashboardPanel">
            <div className="dashboardPanelHeader">
              <div>
                <h2>أحدث المنافسات</h2>
                <p>آخر الطلبات والفرص التي تعمل عليها الشركة</p>
              </div>

              <Link href="/platform/opportunities">عرض الكل</Link>
            </div>

            <div className="opportunityTable">
              {opportunities.map((opportunity) => (
                <div className="opportunityRow" key={opportunity.number}>
                  <div className="opportunityIdentity">
                    <span className="opportunityIcon">RF</span>
                    <div>
                      <strong>{opportunity.title}</strong>
                      <small>
                        {opportunity.number} · {opportunity.closing}
                      </small>
                    </div>
                  </div>

                  <span>{opportunity.offers}</span>

                  <span className={`status ${opportunity.statusClass}`}>
                    {opportunity.status}
                  </span>

                  <button type="button">⋮</button>
                </div>
              ))}
            </div>
          </article>
        </div>

        <aside className="dashboardSideColumn">
          <article className="dashboardPanel aiCommandPanel">
            <div className="aiPanelHeader">
              <span className="aiIcon">✦</span>
              <div>
                <h2>مساعد عقود</h2>
                <p>أنشئ طلبًا أو ابحث عن معلومة.</p>
              </div>
            </div>

            <textarea
              placeholder="مثال: أنشئ طلب عرض سعر لتوريد 200 طن حديد..."
              rows={4}
            />

            <div className="aiPanelActions">
              <button type="button">إرفاق ملف</button>
              <Link href="/platform/opportunities/new">إنشاء مسودة</Link>
            </div>
          </article>

          <article className="dashboardPanel">
            <div className="dashboardPanelHeader">
              <div>
                <h2>مهامي</h2>
                <p>الإجراءات المطلوبة منك</p>
              </div>

              <span className="taskCount">5</span>
            </div>

            <div className="taskList">
              {tasks.map((task) => (
                <div className="taskRow" key={task.title}>
                  <span className="taskMarker" />
                  <div>
                    <strong>{task.title}</strong>
                    <small>{task.project}</small>
                  </div>
                  <span>{task.due}</span>
                </div>
              ))}
            </div>
          </article>
        </aside>
      </section>
    </main>
  );
}
