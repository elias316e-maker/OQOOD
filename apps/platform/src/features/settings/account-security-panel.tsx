"use client";

import { FormEvent, useEffect, useState } from "react";

import { authClient } from "@/lib/auth-client";
import styles from "./account-security-panel.module.css";

type SessionItem = {
  token: string;
  createdAt: Date | string;
  expiresAt: Date | string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export function AccountSecurityPanel({
  twoFactorEnabled,
}: {
  twoFactorEnabled: boolean;
}) {
  const [enabled, setEnabled] = useState(twoFactorEnabled);
  const [password, setPassword] = useState("");
  const [totpURI, setTotpURI] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function refreshSessions() {
    const result = await authClient.listSessions();
    if (result.data) setSessions(result.data as SessionItem[]);
  }

  useEffect(() => {
    let active = true;

    void authClient.listSessions().then((result) => {
      if (active && result.data) {
        setSessions(result.data as SessionItem[]);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  async function enable(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const result = await authClient.twoFactor.enable({
      password,
      issuer: "OQOOD",
    });
    setPending(false);
    if (result.error) {
      setMessage("تعذر بدء الإعداد. تحقق من كلمة المرور.");
      return;
    }
    setTotpURI(result.data.totpURI);
    setBackupCodes(result.data.backupCodes);
    setMessage("أضف المفتاح إلى تطبيق المصادقة ثم أكد الرمز.");
  }

  async function verify(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    const result = await authClient.twoFactor.verifyTotp({ code });
    setPending(false);
    if (result.error) {
      setMessage("رمز المصادقة غير صحيح.");
      return;
    }
    setEnabled(true);
    setPassword("");
    setTotpURI("");
    setCode("");
    setMessage("تم تفعيل المصادقة الثنائية بنجاح.");
  }

  async function disable(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    const result = await authClient.twoFactor.disable({ password });
    setPending(false);
    if (result.error) {
      setMessage("تعذر التعطيل. تحقق من كلمة المرور.");
      return;
    }
    setEnabled(false);
    setPassword("");
    setBackupCodes([]);
    setMessage("تم تعطيل المصادقة الثنائية.");
  }

  async function revoke(token: string) {
    await authClient.revokeSession({ token });
    await refreshSessions();
    setMessage("تم إنهاء الجلسة المحددة.");
  }

  async function revokeOthers() {
    await authClient.revokeOtherSessions();
    await refreshSessions();
    setMessage("تم إنهاء جميع الجلسات الأخرى.");
  }

  return (
    <section className={styles.panel}>
      <div className={styles.heading}>
        <div>
          <span>أمان الحساب</span>
          <h2>المصادقة الثنائية والجلسات</h2>
        </div>
        <strong className={enabled ? styles.enabled : styles.disabled}>
          {enabled ? "مفعّلة" : "غير مفعّلة"}
        </strong>
      </div>

      {message && <p className={styles.message}>{message}</p>}

      {!enabled && !totpURI && (
        <form className={styles.form} onSubmit={enable}>
          <p>احمِ حسابك برمز متغير من تطبيق المصادقة.</p>
          <input
            type="password"
            placeholder="كلمة المرور الحالية"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button disabled={pending}>بدء التفعيل</button>
        </form>
      )}

      {totpURI && (
        <form className={styles.form} onSubmit={verify}>
          <label>مفتاح تطبيق المصادقة</label>
          <code className={styles.uri}>{totpURI}</code>
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="رمز التحقق المكوّن من 6 أرقام"
            value={code}
            onChange={(event) => setCode(event.target.value.trim())}
            required
          />
          <button disabled={pending}>تأكيد التفعيل</button>
        </form>
      )}

      {enabled && (
        <form className={styles.form} onSubmit={disable}>
          <input
            type="password"
            placeholder="كلمة المرور الحالية"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button className={styles.danger} disabled={pending}>
            تعطيل المصادقة الثنائية
          </button>
        </form>
      )}

      {backupCodes.length > 0 && (
        <div className={styles.codes}>
          <h3>رموز الاسترداد — احفظها الآن</h3>
          <div>{backupCodes.map((item) => <code key={item}>{item}</code>)}</div>
        </div>
      )}

      <div className={styles.sessionsHeader}>
        <div><h3>الجلسات النشطة</h3><p>الأجهزة والمتصفحات المسجلة في حسابك.</p></div>
        <button type="button" onClick={revokeOthers}>إنهاء الجلسات الأخرى</button>
      </div>
      <div className={styles.sessions}>
        {sessions.map((session) => (
          <article key={session.token}>
            <div>
              <strong>{describeDevice(session.userAgent)}</strong>
              <span>{session.ipAddress || "عنوان غير متاح"}</span>
              <small>تنتهي {new Date(session.expiresAt).toLocaleString("ar-SA")}</small>
            </div>
            <button type="button" onClick={() => revoke(session.token)}>إنهاء</button>
          </article>
        ))}
      </div>
    </section>
  );
}

function describeDevice(userAgent?: string | null) {
  if (!userAgent) return "جهاز غير معروف";
  const browser = userAgent.includes("Edg")
    ? "Edge"
    : userAgent.includes("Chrome")
      ? "Chrome"
      : userAgent.includes("Firefox")
        ? "Firefox"
        : userAgent.includes("Safari")
          ? "Safari"
          : "متصفح";
  const system = userAgent.includes("Windows")
    ? "Windows"
    : userAgent.includes("Android")
      ? "Android"
      : userAgent.includes("iPhone")
        ? "iPhone"
        : userAgent.includes("Mac")
          ? "macOS"
          : "جهاز";
  return `${browser} على ${system}`;
}
