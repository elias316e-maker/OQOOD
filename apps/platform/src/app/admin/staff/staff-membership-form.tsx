"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert, Button, Select } from "@oqood/design-system";

import type { PlatformRole } from "@/features/platform-administration/permissions";
import { updateStaffMembershipAction } from "./actions";
import styles from "./page.module.css";

type Props = {
  staffId: string;
  name: string;
  role: PlatformRole;
  status: "ACTIVE" | "SUSPENDED";
  authorizationVersion: number;
};

export function StaffMembershipForm({
  staffId, name, role, status, authorizationVersion,
}: Props) {
  const [state, action, pending] = useActionState(
    updateStaffMembershipAction,
    { success: false, message: "" },
  );

  return (
    <form
      action={action}
      className={styles.membershipForm}
      aria-label={`تعديل عضوية ${name}`}
    >
      <input type="hidden" name="staffId" value={staffId} />
      <input
        type="hidden"
        name="authorizationVersion"
        value={authorizationVersion}
      />

      <Select
        key={`${role}-${authorizationVersion}`}
        name="role"
        label={`الدور الإداري: ${name}`}
        defaultValue={role}
        disabled={pending}
        required
      >
        <option value="PLATFORM_ADMIN">مدير المنصة</option>
        <option value="SUPPORT">الدعم</option>
        <option value="BILLING">الفوترة</option>
        <option value="AUDITOR">المراجع</option>
      </Select>

      <Select
        key={`${status}-${authorizationVersion}`}
        name="status"
        label={`حالة العضوية: ${name}`}
        defaultValue={status}
        disabled={pending}
        required
      >
        <option value="ACTIVE">نشطة</option>
        <option value="SUSPENDED">معلّقة</option>
      </Select>

      <Button type="submit" disabled={pending} aria-busy={pending}>
        {pending ? "جارٍ الحفظ..." : "حفظ العضوية"}
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
  );
}
