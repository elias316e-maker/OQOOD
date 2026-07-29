"use client";
import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
function ResetPasswordForm() {
  const router = useRouter(); const params = useSearchParams(); const token = params.get("token"); const invalid = params.get("error") === "INVALID_TOKEN" || !token;
  const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState(""); const [error, setError] = useState(""); const [pending, setPending] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); if (password.length < 8 || password !== confirm) { setError("تأكد من تطابق كلمتي المرور وألا تقل الكلمة عن 8 أحرف."); return; } setPending(true); const result = await authClient.resetPassword({ newPassword: password, token: token! }); setPending(false); if (result.error) { setError("الرابط غير صالح أو انتهت مدته."); return; } router.replace("/login"); }
  return <main className="authPage" dir="rtl"><section className="authCard"><div className="authBrand">OQOOD</div><h1>تعيين كلمة مرور جديدة</h1>{invalid ? <><p>رابط الاستعادة غير صالح أو انتهت صلاحيته.</p><Link href="/forgot-password">طلب رابط جديد</Link></> : <form onSubmit={submit}><label htmlFor="new-password">كلمة المرور الجديدة</label><input id="new-password" minLength={8} onChange={(event) => setPassword(event.target.value)} required type="password"/><label htmlFor="confirm-password">تأكيد كلمة المرور</label><input id="confirm-password" minLength={8} onChange={(event) => setConfirm(event.target.value)} required type="password"/>{error && <p role="alert">{error}</p>}<button disabled={pending}>{pending ? "جارٍ الحفظ..." : "حفظ كلمة المرور"}</button></form>}<Link href="/login">العودة إلى تسجيل الدخول</Link></section></main>;
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
