import Link from "next/link";

const capabilities = [
  {
    number: "01",
    title: "الفرص والمنافسات",
    description:
      "إنشاء ونشر طلبات الأسعار وطلبات العروض والمنافسات العامة والمحدودة.",
  },
  {
    number: "02",
    title: "شركاء الأعمال",
    description:
      "إدارة الموردين والمقاولين والاستشاريين ومقدمي الخدمات من ملف موحد.",
  },
  {
    number: "03",
    title: "التقييم والترسية",
    description:
      "مقارنة العروض والتقييم الفني والمالي واعتماد قرار الترسية.",
  },
  {
    number: "04",
    title: "العقود والمشتريات",
    description:
      "تحويل العرض الفائز إلى عقد أو أمر شراء ومتابعة دورة التنفيذ.",
  },
];

const workflow = [
  "إنشاء الاحتياج",
  "نشر الطلب",
  "استقبال العروض",
  "التقييم",
  "الترسية",
  "العقد",
];

export default function Home() {
  return (
    <main>
      <header className="topbar">
        <Link className="brand" href="/">
          <span className="brandMark">ع</span>
          <span>
            <strong>عقود</strong>
            <small>OQOOD</small>
          </span>
        </Link>

        <nav className="navigation" aria-label="القائمة الرئيسية">
          <a href="#solutions">الحلول</a>
          <a href="#workflow">آلية العمل</a>
          <a href="#partners">شركاء الأعمال</a>
          <a href="#about">عن عقود</a>
        </nav>

        <div className="headerActions">
          <Link className="textButton" href="/login">
            تسجيل الدخول
          </Link>
          <Link className="primaryButton smallButton" href="/platform">
            الدخول التجريبي
          </Link>
        </div>
      </header>

      <section className="hero">
        <div className="heroContent">
          <span className="eyebrow">منصة الأعمال والتعاقدات للقطاع الخاص</span>

          <h1>
            حوّل احتياج شركتك إلى
            <span> عقد معتمد</span>
            من مكان واحد.
          </h1>

          <p>
            أنشئ المنافسات وطلبات الأسعار، ادعُ شركاء الأعمال، استقبل
            العروض، قارنها وقيّمها، ثم أصدر الترسية والعقد ضمن دورة موحدة
            وآمنة.
          </p>

          <div className="heroActions">
            <Link className="primaryButton" href="/platform">
              استكشف المنصة
            </Link>
            <a className="secondaryButton" href="#workflow">
              تعرف على آلية العمل
            </a>
          </div>

          <div className="trustRow">
            <span>شفافية أعلى</span>
            <span>دورة أسرع</span>
            <span>قرارات موثقة</span>
          </div>
        </div>

        <div className="heroPanel">
          <div className="panelHeader">
            <div>
              <small>مركز القيادة</small>
              <h2>موجز الأعمال اليوم</h2>
            </div>
            <span className="liveBadge">مباشر</span>
          </div>

          <div className="metrics">
            <article>
              <small>منافسات نشطة</small>
              <strong>12</strong>
              <span>+3 هذا الأسبوع</span>
            </article>
            <article>
              <small>عروض مستلمة</small>
              <strong>47</strong>
              <span>8 تحتاج مراجعة</span>
            </article>
            <article>
              <small>عقود نشطة</small>
              <strong>18</strong>
              <span>بقيمة 18.4 مليون</span>
            </article>
          </div>

          <div className="activityList">
            <div className="activityItem">
              <span className="activityIcon violet">01</span>
              <div>
                <strong>اعتماد الترسية النهائية</strong>
                <small>مشروع أعمال التشجير والري</small>
              </div>
              <span className="status warning">إجراء مطلوب</span>
            </div>

            <div className="activityItem">
              <span className="activityIcon cyan">02</span>
              <div>
                <strong>طلب عرض سعر جديد</strong>
                <small>توريد أنابيب فولاذية</small>
              </div>
              <span className="status success">مفتوح</span>
            </div>

            <div className="activityItem">
              <span className="activityIcon blue">03</span>
              <div>
                <strong>مراجعة تقييم فني</strong>
                <small>خدمات التشغيل والصيانة</small>
              </div>
              <span className="status neutral">قيد المراجعة</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section workflowSection" id="workflow">
        <div className="sectionHeading">
          <span className="eyebrow">دورة العمل</span>
          <h2>من الاحتياج إلى العقد بخطوات واضحة</h2>
          <p>
            صممنا عقود لتوحيد دورة الشراء والتعاقد وتقليل العمل اليدوي
            المتكرر.
          </p>
        </div>

        <div className="workflow">
          {workflow.map((item, index) => (
            <div className="workflowStep" key={item}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{item}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="section" id="solutions">
        <div className="sectionHeading">
          <span className="eyebrow">القدرات الأساسية</span>
          <h2>كل ما تحتاجه لإدارة المنافسة والتعاقد</h2>
        </div>

        <div className="capabilityGrid">
          {capabilities.map((capability) => (
            <article className="capabilityCard" key={capability.number}>
              <span>{capability.number}</span>
              <h3>{capability.title}</h3>
              <p>{capability.description}</p>
              <Link href="/platform">استكشف القدرة ←</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="section partnersSection" id="partners">
        <div className="partnersContent">
          <span className="eyebrow">دليل شركاء الأعمال</span>
          <h2>اعثر على الشريك المناسب لكل فرصة</h2>
          <p>
            ابحث عن الموردين والمقاولين والمصنعين والاستشاريين حسب النشاط
            والمنطقة والشهادات وسجل الأداء.
          </p>
          <Link className="secondaryButton lightButton" href="/platform">
            استكشف دليل الشركات
          </Link>
        </div>

        <div className="partnerCards">
          {["مورد معتمد", "مقاول متخصص", "مصنع محلي"].map((name, index) => (
            <article key={name}>
              <span className="companyLogo">{index + 1}</span>
              <div>
                <strong>{name}</strong>
                <small>موثق داخل منصة عقود</small>
              </div>
              <b>{94 - index * 3}%</b>
            </article>
          ))}
        </div>
      </section>

      <section className="ctaSection" id="about">
        <div>
          <span className="eyebrow">ابدأ الآن</span>
          <h2>أنشئ أول فرصة أعمال خلال دقائق</h2>
          <p>
            ابدأ بطلب عرض سعر، أضف جدول الكميات، ثم ادعُ الشركات المناسبة.
          </p>
        </div>
        <Link className="primaryButton lightPrimaryButton" href="/platform">
          إنشاء فرصة جديدة
        </Link>
      </section>

      <footer className="footer">
        <div>{`© ${new Date().getFullYear()} OQOOD | عقود`}</div>
        <div>
          <a href="#">الخصوصية</a>
          <a href="#">الشروط</a>
          <a href="#">تواصل معنا</a>
        </div>
      </footer>
    </main>
  );
}
