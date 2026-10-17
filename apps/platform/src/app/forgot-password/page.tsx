"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState(""); const [pending, setPending] = useState(false); const [sent, setSent] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); setPending(true); await authClient.requestPasswordReset({ email, redirectTo: `${window.location.origin}/reset-password` }); setPending(false); setSent(true); }
  return <main className="authPage" dir="rtl"><section className="authCard"><div className="authBrand">OQOOD</div><h1>استعادة كلمة المرور</h1><p>{sent ? "إذا كان البريد مسجلاً فستصلك رسالة تحتوي رابطاً صالحاً لمدة ساعة." : "أدخل بريد حسابك وسنرسل رابطاً آمناً لإعادة التعيين."}</p>{!sent && <form onSubmit={submit}><label htmlFor="reset-email">البريد الإلكتروني</label><input autoComplete="email" id="reset-email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email}/><button disabled={pending}>{pending ? "جارٍ الإرسال..." : "إرسال رابط الاستعادة"}</button></form>}<Link href="/login">العودة إلى تسجيل الدخول</Link></section></main>;
}
