"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { OqoodLogo } from "@oqood/design-system";
import { Button } from "@oqood/design-system";
import { Input } from "@oqood/design-system";

export default function LoginPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const formData = new FormData(event.currentTarget);

    const result = await authClient.signIn.email({
      email: String(formData.get("email") ?? "").trim(),
      password: String(formData.get("password") ?? ""),
      rememberMe: Boolean(formData.get("rememberMe")),
    });

    if (result.error) {
      setMessage(result.error.message ?? "بيانات الدخول غير صحيحة.");
      setLoading(false);
      return;
    }

    const callbackUrl = new URLSearchParams(window.location.search).get("callbackURL");
    router.push(callbackUrl?.startsWith("/") ? callbackUrl : "/platform");
    router.refresh();
  }

  return (
    <main className="authLayout">
      <section className="authBrandPanel">
        <div className="authBrandHeader">
          <OqoodLogo inverted />
        </div>

        <div className="authBrandContent">
          <span className="authEyebrow">منصة عقود الذكية</span>

          <h1>
            تحكم كامل في أعمال المشتريات والمنافسات والعقود.
          </h1>

          <p>
            ادخل إلى مساحة عمل شركتك وتابع الفرص، العروض، الاعتمادات،
            والعقود ضمن تجربة موحدة وآمنة.
          </p>

          <div className="authStats">
            <div>
              <strong>100%</strong>
              <span>واجهة عربية</span>
            </div>
            <div>
              <strong>24/7</strong>
              <span>وصول سحابي</span>
            </div>
            <div>
              <strong>360°</strong>
              <span>رؤية تشغيلية</span>
            </div>
          </div>
        </div>

        <div className="authBrandFooter">
          <span>Security by Design</span>
          <span>Arabic First</span>
        </div>
      </section>

      <section className="authContentPanel">
        <div className="authContentWrapper">
          <div className="authMobileLogo">
            <OqoodLogo />
          </div>

          <header className="authPageHeader">
            <span className="authPageLabel">تسجيل الدخول</span>
            <h2>مرحبًا بعودتك</h2>
            <p>أدخل بيانات حسابك للوصول إلى مساحة العمل.</p>
          </header>

          <form className="authModernForm" onSubmit={handleSubmit}>
            <Input
              autoComplete="email"
              label="البريد الإلكتروني"
              name="email"
              placeholder="name@company.com"
              required
              type="email"
            />

            <Input
              autoComplete="current-password"
              label="كلمة المرور"
              name="password"
              placeholder="أدخل كلمة المرور"
              required
              type="password"
            />

            <div className="authFormOptions">
              <label>
                <input name="rememberMe" type="checkbox" />
                <span>تذكرني</span>
              </label>

              <Link href="/forgot-password">
                نسيت كلمة المرور؟
              </Link>
            </div>

            {message && (
              <div className="authAlert authAlertError" role="alert">
                {message}
              </div>
            )}

            <Button
              disabled={loading}
              fullWidth
              size="lg"
              type="submit"
            >
              {loading ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
            </Button>
          </form>

          <div className="authDividerModern">
            <span>أو</span>
          </div>

          <Button disabled fullWidth size="lg" title="يتطلب ربط مزود هوية الشركة" variant="outline">
            تسجيل الدخول باستخدام حساب الشركة
          </Button>

          <p className="authSwitchText">
            ليس لديك حساب؟
            <Link href="/register"> إنشاء حساب جديد</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
