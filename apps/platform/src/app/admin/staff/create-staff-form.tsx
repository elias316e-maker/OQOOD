"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert, Button, Input, Select } from "@oqood/design-system";

import { createStaffAction } from "./create-actions";
import styles from "./page.module.css";

export function CreateStaffForm() {
  const [state, action, pending] = useActionState(
    createStaffAction,
    { success: false, message: "" },
  );

  return (
    <section aria-labelledby="create-staff-title">
      <h2 id="create-staff-title">إضافة موظف إداري</h2>
      <p>
        اختر حسابًا موجودًا بعد مراجعة هويته. ستُنشأ العضوية
        معلّقة، ولن يصبح الدخول الإداري متاحًا حتى تفعيلها.
      </p>

      <form action={action} className={styles.membershipForm}>
        <Input
          label="معرّف الحساب الموجود"
          hint="استخدم المعرّف الدقيق للحساب الذي راجعت هويته."
          name="targetUserId"
          maxLength={128}
          autoComplete="off"
          dir="ltr"
          required
          disabled={pending}
        />

        <Select
          name="role"
          label="الدور الإداري المطلوب"
          defaultValue="SUPPORT"
          required
          disabled={pending}
        >
          <option value="SUPPORT">الدعم</option>
          <option value="BILLING">الفوترة</option>
          <option value="AUDITOR">المراجع</option>
          <option value="PLATFORM_ADMIN">مدير المنصة</option>
        </Select>

        <label>
          <input
            type="checkbox"
            name="confirmed"
            required
            disabled={pending}
          />{" "}
          راجعت الحساب المستهدف والدور المطلوب.
        </label>

        <Button type="submit" disabled={pending} aria-busy={pending}>
          {pending ? "جارٍ الإضافة..." : "إضافة عضوية معلّقة"}
        </Button>

        {state.message && (
          <Alert
            tone={state.success ? "success" : "danger"}
            role={state.success ? "status" : "alert"}
          >
            {state.message}
          </Alert>
        )}

        <Link href="/admin/verify">إعادة التحقق الإداري</Link>
      </form>
    </section>
  );
}
