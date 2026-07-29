"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

export default function TwoFactorPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [backupMode, setBackupMode] = useState(false);
  const [trustDevice, setTrustDevice] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");

    const result = backupMode
      ? await authClient.twoFactor.verifyBackupCode({
          code,
          trustDevice,
          disableSession: false,
        })
      : await authClient.twoFactor.verifyTotp({ code, trustDevice });

    setPending(false);
    if (result.error) {
      setError(
        result.error.code === "ACCOUNT_TEMPORARILY_LOCKED"
          ? "تم إيقاف المحاولات مؤقتاً لحماية حسابك. حاول لاحقاً."
          : "رمز التحقق غير صحيح أو منتهي الصلاحية.",
      );
      return;
    }

    router.replace("/platform");
    router.refresh();
  }

  return (
    <main className="authPage" dir="rtl">
      <section className="authCard">
        <div className="authBrand">OQOOD</div>
        <h1>التحقق بخطوتين</h1>
        <p>
          {backupMode
            ? "أدخل أحد رموز الاسترداد المحفوظة لديك."
            : "أدخل الرمز المكوّن من 6 أرقام من تطبيق المصادقة."}
        </p>
        <form onSubmit={submit}>
          <label htmlFor="two-factor-code">رمز التحقق</label>
          <input
            id="two-factor-code"
            value={code}
            onChange={(event) => setCode(event.target.value.trim())}
            inputMode={backupMode ? "text" : "numeric"}
            autoComplete="one-time-code"
            required
          />
          <label>
            <input
              type="checkbox"
              checked={trustDevice}
              onChange={(event) => setTrustDevice(event.target.checked)}
            />
            الوثوق بهذا الجهاز لمدة 30 يوماً
          </label>
          {error && <p role="alert">{error}</p>}
          <button disabled={pending} type="submit">
            {pending ? "جارٍ التحقق..." : "متابعة آمنة"}
          </button>
        </form>
        <button type="button" onClick={() => setBackupMode((value) => !value)}>
          {backupMode ? "استخدام تطبيق المصادقة" : "استخدام رمز استرداد"}
        </button>
        <Link href="/login">العودة إلى تسجيل الدخول</Link>
      </section>
    </main>
  );
}
