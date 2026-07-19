import Link from "next/link";
import { Input, Select, Textarea } from "@oqood/design-system";

const partners = [
  {
    name: "شركة الخليج للأنابيب",
    category: "مورد مواد صناعية",
    city: "الدمام",
    score: "94%",
    verified: true,
  },
  {
    name: "مصنع الشرقية للصناعات المعدنية",
    category: "مصنع معتمد",
    city: "الجبيل",
    score: "91%",
    verified: true,
  },
  {
    name: "شركة الإمداد المتكامل",
    category: "مورد وموزع",
    city: "الرياض",
    score: "88%",
    verified: false,
  },
  {
    name: "مؤسسة الأفق للمقاولات",
    category: "مقاول متخصص",
    city: "الخبر",
    score: "86%",
    verified: true,
  },
];

const steps = [
  "المعلومات الأساسية",
  "جدول الكميات",
  "الشروط والمرفقات",
  "شركاء الأعمال",
  "المراجعة والنشر",
];

export default function PartnersPage() {
  return (
    <main className="platformContent">
      <section className="listPageHeader">
        <div>
          <span className="pageEyebrow">RFQ-2026-0016</span>
          <h1>دعوة شركاء الأعمال</h1>
          <p>اختر الشركات التي ستستقبل طلب عرض السعر.</p>
        </div>

        <div className="commandHeaderActions">
          <Link
            className="secondaryButton compactButton"
            href="/platform/opportunities/new/boq"
          >
            رجوع
          </Link>

          <button className="primaryButton compactButton" type="button">
            حفظ كمسودة
          </button>
        </div>
      </section>

      <section className="opportunityWizard">
        <aside className="wizardSteps">
          {steps.map((step, index) => (
            <div
              className={index === 3 ? "wizardStep active" : "wizardStep"}
              key={step}
            >
              <span>{index + 1}</span>
              <div>
                <strong>{step}</strong>
                <small>
                  {index < 3
                    ? "مكتملة"
                    : index === 3
                      ? "الخطوة الحالية"
                      : "لم تبدأ"}
                </small>
              </div>
            </div>
          ))}
        </aside>

        <section className="wizardContent">
          <div className="wizardSectionHeader">
            <div>
              <h2>شركاء الأعمال المؤهلون</h2>
              <p>تم اقتراح الشركات بناءً على التصنيف والموقع.</p>
            </div>

            <span className="selectedPartnerBadge">تم اختيار 2</span>
          </div>

          <div className="partnerSearchToolbar">
            <Input
              type="search"
              placeholder="ابحث باسم الشركة أو النشاط..."
            />

            <Select defaultValue="all">
              <option value="all">جميع المدن</option>
              <option value="riyadh">الرياض</option>
              <option value="dammam">الدمام</option>
              <option value="jubail">الجبيل</option>
            </Select>

            <Select defaultValue="qualified">
              <option value="qualified">المؤهلون فقط</option>
              <option value="all">جميع الشركات</option>
            </Select>

            <button className="secondaryButton compactButton" type="button">
              إضافة شركة يدويًا
            </button>
          </div>

          <div className="partnerSelectionList">
            {partners.map((partner, index) => (
              <label
                className={
                  index < 2
                    ? "partnerSelectionCard selected"
                    : "partnerSelectionCard"
                }
                key={partner.name}
              >
                <input defaultChecked={index < 2} type="checkbox" />

                <span className="partnerAvatar">
                  {partner.name.charAt(0)}
                </span>

                <span className="partnerInfo">
                  <strong>
                    {partner.name}
                    {partner.verified && (
                      <span className="verifiedBadge">موثق</span>
                    )}
                  </strong>
                  <small>
                    {partner.category} · {partner.city}
                  </small>
                </span>

                <span className="partnerScore">
                  <small>درجة الثقة</small>
                  <strong>{partner.score}</strong>
                </span>

                <button type="button">عرض الملف</button>
              </label>
            ))}
          </div>

          <div className="invitationSettings">
            <div className="formField">
              <label htmlFor="message">رسالة الدعوة</label>
              <Textarea
                defaultValue="يسرنا دعوتكم لتقديم عرض فني ومالي للطلب المرفق، وفق الشروط والمواصفات المحددة."
                id="message"
                rows={4}
              />
            </div>

            <div className="invitationOptions">
              <label>
                <input defaultChecked type="checkbox" />
                إرسال إشعار عبر البريد الإلكتروني
              </label>

              <label>
                <input defaultChecked type="checkbox" />
                السماح بإرسال الاستفسارات
              </label>

              <label>
                <input type="checkbox" />
                إخفاء أسماء الشركات المدعوة
              </label>
            </div>
          </div>

          <div className="wizardFooter">
            <span>ستتم دعوة شركتين عند نشر المنافسة.</span>

            <Link
              className="primaryButton compactButton"
              href="/platform/opportunities"
            >
              حفظ ومراجعة المنافسة
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
