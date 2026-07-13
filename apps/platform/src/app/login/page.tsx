import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="authPage">
      <section className="authVisual">
        <Link className="brand authBrand" href="/">
          <span className="brandMark">ع</span>
          <span>
            <strong>عقود</strong>
            <small>OQOOD</small>
          </span>
        </Link>

        <div className="authVisualContent">
          <span className="eyebrow lightEyebrow">منصة التعاقدات الخاصة</span>

          <h1>
            أدِر المنافسات والعروض والعقود من مساحة عمل واحدة.
          </h1>

          <p>
            تابع فرص شركتك، استقبل عروض الموردين، قارن الأسعار واتخذ قرارات
            الترسية ضمن إجراءات موثقة وآمنة.
          </p>

          <div className="authBenefits">
            <span>✓ إدارة مركزية للفرص</span>
            <span>✓ فصل التقييم الفني والمالي</span>
            <span>✓ سجل كامل لجميع الإجراءات</span>
          </div>
        </div>
      </section>

      <section className="authFormSection">
        <div className="authFormCard">
          <div className="authFormHeader">
            <span className="mobileAuthLogo">ع</span>
            <h2>تسجيل الدخول</h2>
            <p>أدخل بيانات حسابك للوصول إلى مساحة العمل.</p>
          </div>

          <form className="authForm">
            <label>
              البريد الإلكتروني
              <input
                type="email"
                name="email"
                placeholder="name@company.com"
                autoComplete="email"
              />
            </label>

            <label>
              كلمة المرور
              <input
                type="password"
                name="password"
                placeholder="أدخل كلمة المرور"
                autoComplete="current-password"
              />
            </label>

            <div className="authOptions">
              <label className="checkboxLabel">
                <input type="checkbox" />
                تذكرني
              </label>

              <Link href="/forgot-password">نسيت كلمة المرور؟</Link>
            </div>

            <Link className="primaryButton authSubmit" href="/platform">
              الدخول إلى المنصة
            </Link>
          </form>

          <div className="authDivider">
            <span>أو</span>
          </div>

          <button className="secondaryButton authSecondary" type="button">
            الدخول باستخدام حساب الشركة
          </button>

          <p className="authRegister">
            ليس لديك حساب؟
            <Link href="/register"> إنشاء حساب شركة</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
