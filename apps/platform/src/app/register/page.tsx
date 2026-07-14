"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function RegisterPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const formData = new FormData(event.currentTarget);

    const result = await authClient.signUp.email({
      name: String(formData.get("name")),
      email: String(formData.get("email")),
      password: String(formData.get("password")),
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
    <main className="authPage">
      <section className="authFormSection">
        <div className="authFormCard">
          <div className="authFormHeader">
            <h2>إنشاء حساب</h2>
            <p>أنشئ حسابك للبدء في استخدام منصة عقود.</p>
          </div>

          <form className="authForm" onSubmit={handleSubmit}>
            <label>
              الاسم الكامل
              <input name="name" required />
            </label>

            <label>
              البريد الإلكتروني
              <input name="email" type="email" required />
            </label>

            <label>
              كلمة المرور
              <input name="password" type="password" minLength={8} required />
            </label>

            {message && <p className="authError">{message}</p>}

            <button
              className="primaryButton authSubmit"
              disabled={loading}
              type="submit"
            >
              {loading ? "جارٍ إنشاء الحساب..." : "إنشاء الحساب"}
            </button>
          </form>

          <p className="authRegister">
            لديك حساب؟
            <Link href="/login"> تسجيل الدخول</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
