"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  Alert,
  EmptyState,
  FormActions,
  FormGuidance,
  FormSection,
} from "@oqood/design-system";

import {
  authClient,
} from "@/lib/auth-client";

import styles from "./account-security-panel.module.css";

type SessionItem = {
  token: string;
  createdAt: Date | string;
  expiresAt: Date | string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

type AccountSecurityPanelProps = {
  twoFactorEnabled: boolean;
};

export function AccountSecurityPanel({
  twoFactorEnabled,
}: AccountSecurityPanelProps) {
  const [enabled, setEnabled] =
    useState(twoFactorEnabled);

  const [password, setPassword] =
    useState("");

  const [totpURI, setTotpURI] =
    useState("");

  const [backupCodes, setBackupCodes] =
    useState<string[]>([]);

  const [code, setCode] =
    useState("");

  const [sessions, setSessions] =
    useState<SessionItem[]>([]);

  const [
    sessionsLoaded,
    setSessionsLoaded,
  ] = useState(false);

  const [message, setMessage] =
    useState("");

  const [pending, setPending] =
    useState(false);

  async function refreshSessions() {
    const result =
      await authClient.listSessions();

    if (result.data) {
      setSessions(
        result.data as SessionItem[],
      );
    }

    setSessionsLoaded(true);
  }

  useEffect(() => {
    let active = true;

    void authClient
      .listSessions()
      .then((result) => {
        if (!active) {
          return;
        }

        if (result.data) {
          setSessions(
            result.data as SessionItem[],
          );
        }

        setSessionsLoaded(true);
      });

    return () => {
      active = false;
    };
  }, []);

  async function enable(
    event: FormEvent,
  ) {
    event.preventDefault();
    setPending(true);
    setMessage("");

    const result =
      await authClient.twoFactor.enable({
        password,
        issuer: "OQOOD",
      });

    setPending(false);

    if (result.error) {
      setMessage(
        "تعذر بدء الإعداد. تحقق من كلمة المرور.",
      );
      return;
    }

    setTotpURI(result.data.totpURI);
    setBackupCodes(
      result.data.backupCodes,
    );

    setMessage(
      "أضف المفتاح إلى تطبيق المصادقة ثم أكد الرمز.",
    );
  }

  async function verify(
    event: FormEvent,
  ) {
    event.preventDefault();
    setPending(true);
    setMessage("");

    const result =
      await authClient.twoFactor.verifyTotp({
        code,
      });

    setPending(false);

    if (result.error) {
      setMessage(
        "رمز المصادقة غير صحيح.",
      );
      return;
    }

    setEnabled(true);
    setPassword("");
    setTotpURI("");
    setCode("");

    setMessage(
      "تم تفعيل المصادقة الثنائية بنجاح.",
    );
  }

  async function disable(
    event: FormEvent,
  ) {
    event.preventDefault();
    setPending(true);
    setMessage("");

    const result =
      await authClient.twoFactor.disable({
        password,
      });

    setPending(false);

    if (result.error) {
      setMessage(
        "تعذر التعطيل. تحقق من كلمة المرور.",
      );
      return;
    }

    setEnabled(false);
    setPassword("");
    setTotpURI("");
    setBackupCodes([]);

    setMessage(
      "تم تعطيل المصادقة الثنائية.",
    );
  }

  async function revoke(
    token: string,
  ) {
    await authClient.revokeSession({
      token,
    });

    await refreshSessions();

    setMessage(
      "تم إنهاء الجلسة المحددة.",
    );
  }

  async function revokeOthers() {
    await authClient.revokeOtherSessions();
    await refreshSessions();

    setMessage(
      "تم إنهاء جميع الجلسات الأخرى.",
    );
  }

  return (
    <FormSection
      className={styles.securityPanel}
      eyebrow="أمان الحساب"
      title="المصادقة الثنائية والجلسات"
      description="حماية الحساب ومراجعة الأجهزة والمتصفحات التي يمكنها الوصول إليه."
      actions={
        <strong
          className={
            enabled
              ? styles.enabled
              : styles.disabled
          }
        >
          {enabled
            ? "المصادقة مفعّلة"
            : "المصادقة غير مفعّلة"}
        </strong>
      }
    >
      <div className={styles.securityFlow}>
        {message ? (
          <Alert
            className={styles.message}
            tone={getMessageTone(message)}
            title={getMessageTitle(
              message,
            )}
            aria-live={
              getMessageTone(message) ===
              "danger"
                ? "assertive"
                : "polite"
            }
          >
            {message}
          </Alert>
        ) : null}

        {!enabled && !totpURI ? (
          <form
            className={
              styles.securityForm
            }
            onSubmit={enable}
          >
            <FormGuidance
              className={
                styles.securityGuidance
              }
              icon="⌾"
              title="فعّل المصادقة الثنائية"
              description="أضف طبقة حماية باستخدام رمز متغير من تطبيق مصادقة متوافق مع TOTP."
            />

            <label
              className={styles.field}
              htmlFor="security-enable-password"
            >
              <span>
                كلمة المرور الحالية
              </span>

              <input
                autoComplete="current-password"
                id="security-enable-password"
                onChange={(event) =>
                  setPassword(
                    event.target.value,
                  )
                }
                required
                type="password"
                value={password}
              />
            </label>

            <FormActions
              className={
                styles.securityActions
              }
              status="ستحتاج إلى تطبيق مصادقة لإكمال التفعيل."
            >
              <button
                className={
                  styles.primaryButton
                }
                disabled={pending}
                type="submit"
              >
                {pending
                  ? "جارٍ بدء التفعيل..."
                  : "بدء التفعيل"}
              </button>
            </FormActions>
          </form>
        ) : null}

        {totpURI ? (
          <form
            className={
              styles.securityForm
            }
            onSubmit={verify}
          >
            <FormGuidance
              className={
                styles.securityGuidance
              }
              icon="⌘"
              title="اربط تطبيق المصادقة"
              description="أضف المفتاح التالي إلى التطبيق، ثم أدخل الرمز المكوّن من ستة أرقام."
            />

            <div
              className={styles.setupKey}
            >
              <span>
                مفتاح تطبيق المصادقة
              </span>

              <code className={styles.uri}>
                {totpURI}
              </code>
            </div>

            <label
              className={styles.field}
              htmlFor="security-totp-code"
            >
              <span>رمز التحقق</span>

              <input
                autoComplete="one-time-code"
                id="security-totp-code"
                inputMode="numeric"
                maxLength={6}
                onChange={(event) =>
                  setCode(
                    event.target.value.trim(),
                  )
                }
                placeholder="000000"
                required
                type="text"
                value={code}
              />
            </label>

            <FormActions
              className={
                styles.securityActions
              }
              status="لن تكتمل الحماية حتى يتم التحقق من الرمز."
            >
              <button
                className={
                  styles.primaryButton
                }
                disabled={pending}
                type="submit"
              >
                {pending
                  ? "جارٍ التحقق..."
                  : "تأكيد التفعيل"}
              </button>
            </FormActions>
          </form>
        ) : null}

        {enabled ? (
          <form
            className={
              styles.securityForm
            }
            onSubmit={disable}
          >
            <FormGuidance
              className={
                styles.securityGuidance
              }
              icon="!"
              title="تعطيل المصادقة الثنائية"
              description="سيؤدي التعطيل إلى إزالة طبقة الحماية الإضافية من الحساب."
            />

            <label
              className={styles.field}
              htmlFor="security-disable-password"
            >
              <span>
                كلمة المرور الحالية
              </span>

              <input
                autoComplete="current-password"
                id="security-disable-password"
                onChange={(event) =>
                  setPassword(
                    event.target.value,
                  )
                }
                required
                type="password"
                value={password}
              />
            </label>

            <FormActions
              className={
                styles.securityActions
              }
              status="استخدم هذا الإجراء فقط عند فقدان الوصول إلى تطبيق المصادقة أو تغييره."
            >
              <button
                className={
                  styles.dangerButton
                }
                disabled={pending}
                type="submit"
              >
                {pending
                  ? "جارٍ التعطيل..."
                  : "تعطيل المصادقة الثنائية"}
              </button>
            </FormActions>
          </form>
        ) : null}

        {backupCodes.length > 0 ? (
          <Alert
            className={
              styles.recoveryCodes
            }
            tone="warning"
            title="رموز الاسترداد — احفظها الآن"
          >
            <p>
              استخدم كل رمز مرة واحدة عند
              تعذر الوصول إلى تطبيق
              المصادقة.
            </p>

            <div
              className={
                styles.recoveryCodeGrid
              }
            >
              {backupCodes.map(
                (item) => (
                  <code key={item}>
                    {item}
                  </code>
                ),
              )}
            </div>
          </Alert>
        ) : null}

        <section
          aria-labelledby="active-sessions-title"
          className={
            styles.sessionsSection
          }
        >
          <div
            className={
              styles.sessionsHeader
            }
          >
            <div>
              <span>
                إدارة الوصول
              </span>

              <h3 id="active-sessions-title">
                الجلسات النشطة
              </h3>

              <p>
                الأجهزة والمتصفحات المسجلة
                في حسابك.
              </p>
            </div>

            <button
              className={
                styles.secondaryButton
              }
              disabled={
                pending ||
                !sessionsLoaded
              }
              onClick={() => {
                void revokeOthers();
              }}
              type="button"
            >
              إنهاء الجلسات الأخرى
            </button>
          </div>

          {!sessionsLoaded ? (
            <div
              className={
                styles.sessionLoading
              }
              role="status"
            >
              جاري تحميل الجلسات النشطة...
            </div>
          ) : sessions.length > 0 ? (
            <div
              className={styles.sessions}
            >
              {sessions.map(
                (session) => (
                  <article
                    key={session.token}
                  >
                    <div
                      className={
                        styles.sessionIdentity
                      }
                    >
                      <strong>
                        {describeDevice(
                          session.userAgent,
                        )}
                      </strong>

                      <span>
                        {session.ipAddress ||
                          "عنوان غير متاح"}
                      </span>

                      <small>
                        بدأت{" "}
                        {new Date(
                          session.createdAt,
                        ).toLocaleString(
                          "ar-SA",
                        )}
                      </small>

                      <small>
                        تنتهي{" "}
                        {new Date(
                          session.expiresAt,
                        ).toLocaleString(
                          "ar-SA",
                        )}
                      </small>
                    </div>

                    <button
                      className={
                        styles.sessionDangerButton
                      }
                      onClick={() => {
                        void revoke(
                          session.token,
                        );
                      }}
                      type="button"
                    >
                      إنهاء
                    </button>
                  </article>
                ),
              )}
            </div>
          ) : (
            <EmptyState
              className={
                styles.compactEmpty
              }
              icon="⌁"
              title="لا توجد جلسات نشطة"
              description="لم يتم العثور على جلسات وصول مرتبطة بالحساب."
              role="status"
            />
          )}
        </section>
      </div>
    </FormSection>
  );
}

function getMessageTone(
  message: string,
): "info" | "success" | "danger" {
  if (
    message.includes("تعذر") ||
    message.includes("غير صحيح")
  ) {
    return "danger";
  }

  if (message.startsWith("تم")) {
    return "success";
  }

  return "info";
}

function getMessageTitle(
  message: string,
): string {
  const tone = getMessageTone(message);

  if (tone === "danger") {
    return "تعذر تنفيذ الإجراء";
  }

  if (tone === "success") {
    return "تم تنفيذ الإجراء";
  }

  return "متابعة إعداد الأمان";
}

function describeDevice(
  userAgent?: string | null,
) {
  if (!userAgent) {
    return "جهاز غير معروف";
  }

  const browser = userAgent.includes(
    "Edg",
  )
    ? "Edge"
    : userAgent.includes("Chrome")
      ? "Chrome"
      : userAgent.includes("Firefox")
        ? "Firefox"
        : userAgent.includes("Safari")
          ? "Safari"
          : "متصفح";

  const system = userAgent.includes(
    "Windows",
  )
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
