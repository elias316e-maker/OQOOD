"use client";

import { useActionState } from "react";
import { Alert, Button } from "@oqood/design-system";
import { useRouter } from "next/navigation";

import { sendAdminEmailVerificationAction } from "./email-actions";
import styles from "../admin.module.css";

export function EmailVerificationForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    sendAdminEmailVerificationAction,
    { success: false, message: "" },
  );

  return (
    <section aria-labelledby="admin-email-title">
      <h2 id="admin-email-title">وثّق بريد الحساب أولًا</h2>
      <p>
        أرسل رابط التوثيق إلى بريد حسابك، وافتحه لإكمال التوثيق.
        توثيق البريد وحده لا يمنح صلاحية إدارية.
      </p>
      <form action={action} className={styles.form}>
        <Button type="submit" disabled={pending} aria-busy={pending}>
          {pending ? "جارٍ الإرسال..." : "إرسال رابط توثيق البريد"}
        </Button>
        {state.message && (
          <Alert
            tone={state.success ? "success" : "danger"}
            role={state.success ? "status" : "alert"}
          >
            {state.message}
          </Alert>
        )}
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => router.refresh()}
        >
          حدّث حالة التوثيق
        </Button>
      </form>
    </section>
  );
}
