"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { OqoodLogo } from "@/components/brand/oqood-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setMessage("كلمتا المرور غير متطابقتين.");
      setLoading(false);
      return;
    }

    const result = await authClient.signUp.email({
      name,
      email,
      password,
    });

    if (result.error) {
      setMessage(result.error.message ?? "تعذر إنشاء الحساب.");
      setLoading(false);
      return;
    }

    router.push("/platform");
    router.refresh();
  }

  return (
    <main className="authLayout">
      <section className="authBrandPanel">
        <div className="authBrandHeader">
          <OqoodLogo inverted />
        </div>

        <div className="authBrandContent">
          <span className="authEyebrow">منصة الأعمال والتعاقدات الذكية</span>

          <h1>
            ابدأ إدارة المنافسات والمشتريات والعقود من منصة واحدة.
          </h1>

          <p>
            أنشئ مساحة عمل شركتك، ادعُ فريقك، وابدأ أول طلب عرض سعر خلال
            دقائق.
          </p>

          <div className="authFeatureList">
            <span>إدارة متكاملة للمنافسات والعقود</span>
            <span>بيئة عربية كاملة واتجاه RTL</span>
            <span>سجل تدقيق وصلاحيات مؤسسية</span>
          </div>
        </div>

        <div className="authBrandFooter">
          <span>OQOOD Platform</span>
          <span>Source-to-Contract</span>
        </div>
      </section>

      <section className="authContentPanel">
        <div className="authContentWrapper">
          <div className="authMobileLogo">
            <OqoodLogo />
          </div>

          <header className="authPageHeader">
            <span className="authPageLabel">إنشاء حساب جديد</span>
            <h2>مرحبًا بك في عقود</h2>
            <p>أدخل بياناتك الأساسية لإنشاء حسابك.</p>
          </header>

          <form className="authModernForm" onSubmit={handleSubmit}>
            <Input
              autoComplete="name"
              label="الاسم الكامل"
              name="name"
              placeholder="مثال: أحمد محمد"
              required
            />

            <Input
              autoComplete="email"
              label="البريد الإلكتروني"
              name="email"
              placeholder="name@company.com"
              required
              type="email"
            />

            <Input
              autoComplete="new-password"
              hint="يجب ألا تقل كلمة المرور عن 8 أحرف."
              label="كلمة المرور"
              minLength={8}
              name="password"
              placeholder="أدخل كلمة مرور قوية"
              required
              type="password"
            />

            <Input
              autoComplete="new-password"
              label="تأكيد كلمة المرور"
              minLength={8}
              name="confirmPassword"
              placeholder="أعد إدخال كلمة المرور"
              required
              type="password"
            />

            <label className="authAgreement">
              <input name="terms" required type="checkbox" />
              <span>
                أوافق على
                <Link href="/terms"> الشروط والأحكام </Link>
                و
                <Link href="/privacy"> سياسة الخصوصية</Link>.
              </span>
            </label>

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
              {loading ? "جارٍ إنشاء الحساب..." : "إنشاء الحساب"}
            </Button>
          </form>

          <p className="authSwitchText">
            لديك حساب بالفعل؟
            <Link href="/login"> تسجيل الدخول</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
