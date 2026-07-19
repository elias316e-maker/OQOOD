import Link from "next/link";
import { Input, Select } from "@oqood/design-system";

const boqItems = [
  {
    item: "1",
    description: "توريد أنابيب فولاذية حسب المواصفات المعتمدة",
    quantity: "100",
    unit: "متر طولي",
    specification: "ASTM A106 Grade B",
  },
  {
    item: "2",
    description: "توريد وصلات وأكواع فولاذية",
    quantity: "25",
    unit: "قطعة",
    specification: "مطابقة للمخططات",
  },
];

const steps = [
  "المعلومات الأساسية",
  "جدول الكميات",
  "الشروط والمرفقات",
  "شركاء الأعمال",
  "المراجعة والنشر",
];

export default function BoqPage() {
  return (
    <main className="platformContent">
      <section className="listPageHeader">
        <div>
          <span className="pageEyebrow">RFQ-2026-0016</span>
          <h1>جدول الكميات</h1>
          <p>أضف البنود والكميات والوحدات والمواصفات المطلوبة.</p>
        </div>

        <div className="commandHeaderActions">
          <Link
            className="secondaryButton compactButton"
            href="/platform/opportunities/new"
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
              className={index === 1 ? "wizardStep active" : "wizardStep"}
              key={step}
            >
              <span>{index + 1}</span>
              <div>
                <strong>{step}</strong>
                <small>
                  {index < 1
                    ? "مكتملة"
                    : index === 1
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
              <h2>بنود جدول الكميات</h2>
              <p>يمكن إضافة البنود يدويًا أو رفع ملف Excel لاحقًا.</p>
            </div>

            <div className="boqHeaderActions">
              <button className="secondaryButton compactButton" type="button">
                رفع Excel
              </button>

              <button className="primaryButton compactButton" type="button">
                + إضافة بند
              </button>
            </div>
          </div>

          <div className="boqTableWrapper">
            <table className="dataTable boqTable">
              <thead>
                <tr>
                  <th>#</th>
                  <th>وصف البند</th>
                  <th>الكمية</th>
                  <th>الوحدة</th>
                  <th>المواصفة</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {boqItems.map((item) => (
                  <tr key={item.item}>
                    <td>{item.item}</td>

                    <td>
                      <Input defaultValue={item.description} />
                    </td>

                    <td>
                      <Input defaultValue={item.quantity} type="number" />
                    </td>

                    <td>
                      <Select defaultValue={item.unit}>
                        <option>متر طولي</option>
                        <option>قطعة</option>
                        <option>طن</option>
                        <option>متر مربع</option>
                        <option>متر مكعب</option>
                        <option>دفعة</option>
                      </Select>
                    </td>

                    <td>
                      <Input defaultValue={item.specification} />
                    </td>

                    <td>
                      <button className="tableActionButton dangerText" type="button">
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}

                <tr className="newBoqRow">
                  <td>3</td>
                  <td>
                    <Input placeholder="أدخل وصف البند" />
                  </td>
                  <td>
                    <Input placeholder="0" type="number" />
                  </td>
                  <td>
                    <Select defaultValue="">
                      <option disabled value="">
                        اختر الوحدة
                      </option>
                      <option>قطعة</option>
                      <option>متر طولي</option>
                      <option>طن</option>
                      <option>دفعة</option>
                    </Select>
                  </td>
                  <td>
                    <Input placeholder="المواصفة أو المرجع الفني" />
                  </td>
                  <td>
                    <button className="tableActionButton" type="button">
                      +
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="boqSummary">
            <div>
              <span>عدد البنود</span>
              <strong>2</strong>
            </div>

            <div>
              <span>البنود المكتملة</span>
              <strong>2</strong>
            </div>

            <div>
              <span>البنود الناقصة</span>
              <strong>0</strong>
            </div>
          </div>

          <div className="wizardFooter">
            <span>تم حفظ جدول الكميات تلقائيًا.</span>

            <Link
              className="primaryButton compactButton"
              href="/platform/opportunities/new/partners"
            >
              حفظ والانتقال إلى شركاء الأعمال
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
