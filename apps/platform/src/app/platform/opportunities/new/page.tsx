import Link from "next/link";

const steps = [
  "المعلومات الأساسية",
  "جدول الكميات",
  "الشروط والمرفقات",
  "شركاء الأعمال",
  "المراجعة والنشر",
];

export default function NewOpportunityPage() {
  return (
    <main className="platformContent">
      <section className="listPageHeader">
        <div>
          <span className="pageEyebrow">فرصة جديدة</span>
          <h1>إنشاء طلب عرض سعر</h1>
          <p>مسودة رقم RFQ-2026-0016</p>
        </div>

        <div className="commandHeaderActions">
          <Link
            className="secondaryButton compactButton"
            href="/platform/opportunities"
          >
            إلغاء
          </Link>

          <button className="primaryButton compactButton" type="button">
            حفظ كمسودة
          </button>
        </div>
      </section>

      <section className="opportunityWizard">
        <aside className="wizardSteps">
          {steps.map((step, index) => (
            <div className={index === 0 ? "wizardStep active" : "wizardStep"} key={step}>
              <span>{index + 1}</span>
              <div>
                <strong>{step}</strong>
                <small>{index === 0 ? "الخطوة الحالية" : "لم تبدأ"}</small>
              </div>
            </div>
          ))}
        </aside>

        <section className="wizardContent">
          <div className="wizardSectionHeader">
            <div>
              <h2>المعلومات الأساسية</h2>
              <p>أدخل البيانات الرئيسية لطلب عرض السعر.</p>
            </div>

            <span className="draftBadge">مسودة</span>
          </div>

          <form className="opportunityForm">
            <div className="formField fullWidth">
              <label htmlFor="title">عنوان طلب العرض</label>
              <input
                id="title"
                name="title"
                placeholder="مثال: توريد أنابيب فولاذية لمشروع صناعي"
              />
            </div>

            <div className="formField">
              <label htmlFor="type">نوع الفرصة</label>
              <select id="type" name="type" defaultValue="rfq">
                <option value="rfq">طلب عرض سعر RFQ</option>
                <option value="rfp">طلب تقديم عرض RFP</option>
                <option value="tender">منافسة</option>
              </select>
            </div>

            <div className="formField">
              <label htmlFor="project">المشروع</label>
              <select id="project" name="project" defaultValue="expansion">
                <option value="expansion">مشروع توسعة المنشأة</option>
                <option value="maintenance">مشروع التشغيل والصيانة</option>
                <option value="none">بدون مشروع</option>
              </select>
            </div>

            <div className="formField">
              <label htmlFor="category">التصنيف</label>
              <select id="category" name="category" defaultValue="materials">
                <option value="materials">مواد ومستلزمات</option>
                <option value="services">خدمات</option>
                <option value="equipment">معدات</option>
                <option value="subcontract">مقاولات باطن</option>
              </select>
            </div>

            <div className="formField">
              <label htmlFor="priority">الأولوية</label>
              <select id="priority" name="priority" defaultValue="normal">
                <option value="normal">عادية</option>
                <option value="urgent">عاجلة</option>
                <option value="critical">حرجة</option>
              </select>
            </div>

            <div className="formField">
              <label htmlFor="currency">العملة</label>
              <select id="currency" name="currency" defaultValue="SAR">
                <option value="SAR">ريال سعودي</option>
                <option value="USD">دولار أمريكي</option>
                <option value="AED">درهم إماراتي</option>
              </select>
            </div>

            <div className="formField">
              <label htmlFor="budget">الميزانية التقديرية</label>
              <input id="budget" name="budget" type="number" placeholder="0.00" />
            </div>

            <div className="formField">
              <label htmlFor="issueDate">تاريخ النشر</label>
              <input id="issueDate" name="issueDate" type="date" />
            </div>

            <div className="formField">
              <label htmlFor="closingDate">تاريخ الإغلاق</label>
              <input id="closingDate" name="closingDate" type="date" />
            </div>

            <div className="formField fullWidth">
              <label htmlFor="description">وصف الاحتياج</label>
              <textarea
                id="description"
                name="description"
                rows={5}
                placeholder="اكتب وصفًا واضحًا للمواد أو الخدمات المطلوبة..."
              />
              <small>
                سيظهر هذا الوصف للشركات المدعوة للمنافسة.
              </small>
            </div>

            <div className="formField fullWidth">
              <label>نطاق النشر</label>

              <div className="choiceGrid">
                <label className="choiceCard">
                  <input defaultChecked name="visibility" type="radio" />
                  <span>
                    <strong>منافسة محدودة</strong>
                    <small>الدعوة موجهة لشركات محددة فقط.</small>
                  </span>
                </label>

                <label className="choiceCard">
                  <input name="visibility" type="radio" />
                  <span>
                    <strong>منافسة عامة</strong>
                    <small>تظهر لجميع الشركات المؤهلة.</small>
                  </span>
                </label>

                <label className="choiceCard">
                  <input name="visibility" type="radio" />
                  <span>
                    <strong>طلب مباشر</strong>
                    <small>إرسال طلب سعر إلى شركة واحدة.</small>
                  </span>
                </label>
              </div>
            </div>
          </form>

          <div className="wizardFooter">
            <span>تم حفظ المسودة تلقائيًا</span>

            <Link
              className="primaryButton compactButton"
              href="/platform/opportunities/new/boq"
            >
              حفظ والانتقال إلى جدول الكميات
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
