"use client";

import { useActionState } from "react";
import { Alert, Button, Input } from "@oqood/design-system";

import { verifyAdminSessionAction } from "./actions";
import styles from "../admin.module.css";

export function AdminVerificationForm() {
  const [state, action, pending] = useActionState(
    verifyAdminSessionAction,
    { error: "" },
  );

  return (
    <form action={action} className={styles.form}>
      <Input
        id="admin-verification-code"
        name="code"
        label="رمز تطبيق المصادقة"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]{6}"
        minLength={6}
        maxLength={6}
        required
        disabled={pending}
        dir="ltr"
      />
      {state.error && (
        <Alert tone="danger" role="alert">{state.error}</Alert>
      )}
      <Button type="submit" disabled={pending} aria-busy={pending}>
        {pending ? "جارٍ التحقق..." : "التحقق والدخول"}
      </Button>
    </form>
  );
}
