"use client";

import { useState, type FormEvent } from "react";
import { Alert, Button, Input } from "@oqood/design-system";

import { authClient } from "@/lib/auth-client";
import styles from "../admin.module.css";

export function AdminEnrollmentForm({ enabled }: { enabled: boolean }) {
  const [complete, setComplete] = useState(enabled);
  const [password, setPassword] = useState("");
  const [secret, setSecret] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function start(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const result = await authClient.twoFactor.enable({
        password, issuer: "OQOOD",
      });
      if (result.error || !result.data) {
        setError("تعذر بدء الإعداد. تحقق من كلمة المرور وحاول مجددًا.");
        return;
      }
      const key = new URL(result.data.totpURI).searchParams.get("secret");
      if (!key) throw new Error("Missing enrollment key.");
      setSecret(key);
      setBackupCodes(result.data.backupCodes);
      setPassword("");
    } catch {
      setError("تعذر إكمال الطلب. تحقق من الاتصال وحاول مجددًا.");
    } finally {
      setPending(false);
    }
  }

  async function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const result = await authClient.twoFactor.verifyTotp({
        code, trustDevice: false,
      });
      if (result.error) {
        setError("رمز المصادقة غير صحيح أو منتهي الصلاحية.");
        return;
      }
      setComplete(true);
      setSecret("");
      setCode("");
    } catch {
      setError("تعذر تأكيد الإعداد. تحقق من الاتصال وحاول مجددًا.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={styles.form}>
      {error && <Alert tone="danger" role="alert">{error}</Alert>}

      {complete ? (
        <Alert tone="success" role="status">
          المصادقة الثنائية مفعّلة. يمكنك متابعة التحقق الإداري.
        </Alert>
      ) : secret ? (
        <form onSubmit={confirm} className={styles.form}>
          <p>
            في تطبيق المصادقة اختر إضافة مفتاح يدوي، ثم رمزًا زمنيًا
            من ستة أرقام بفترة 30 ثانية.
          </p>
          <Input
            label="مفتاح الإعداد — احفظه بسرية"
            value={secret}
            readOnly
            dir="ltr"
            autoComplete="off"
          />
          <Input
            label="رمز تطبيق المصادقة"
            value={code}
            onChange={(event) => setCode(event.target.value.trim())}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            minLength={6}
            maxLength={6}
            required
            disabled={pending}
            dir="ltr"
          />
          <Button type="submit" disabled={pending} aria-busy={pending}>
            {pending ? "جارٍ التحقق..." : "تأكيد التفعيل"}
          </Button>
        </form>
      ) : (
        <form onSubmit={start} className={styles.form}>
          <Input
            label="كلمة المرور الحالية"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            disabled={pending}
          />
          <Button type="submit" disabled={pending} aria-busy={pending}>
            {pending ? "جارٍ بدء الإعداد..." : "إعداد تطبيق المصادقة"}
          </Button>
        </form>
      )}

      {backupCodes.length > 0 && (
        <Alert tone="warning" title="احفظ رموز الاسترداد الآن">
          <p>
            احتفظ بها في مكان آمن. تساعدك على استعادة تسجيل الدخول
            للحساب، لكنها لا تمنح التحقق الإداري المطلوب.
          </p>
          <ul dir="ltr">
            {backupCodes.map((item) => <li key={item}><code>{item}</code></li>)}
          </ul>
          <Button
            type="button"
            variant="outline"
            onClick={() => setBackupCodes([])}
          >
            حفظت الرموز — إخفاؤها
          </Button>
        </Alert>
      )}
    </div>
  );
}
