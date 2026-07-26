import Link from "next/link";

import {
  ProcurementCreateForm,
} from "@/features/procurement";

import {
  hasPermission,
  Permissions,
} from "@/lib/permissions";

import {
  requireCurrentWorkspace,
} from "@/lib/workspace-context";

function createDraftNumber(): string {
  const date = new Date();
  const datePart = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");
  const randomPart = Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase();

  return `PR-${datePart}-${randomPart}`;
}

export default async function NewProcurementRequestPage() {
  const workspaceContext =
    await requireCurrentWorkspace();

  const canCreate = hasPermission(
    workspaceContext,
    Permissions.procurement.create,
  );

  if (!canCreate) {
    return (
      <main className="platformContent">
        <section className="dashboardPanel">
          <div className="emptyState" role="alert">
            <h1>ليس لديك صلاحية إنشاء طلب مشتريات</h1>
            <p>
              تواصل مع مسؤول مساحة العمل للحصول على الصلاحية
              المطلوبة.
            </p>
            <Link
              className="primaryButton compactButton"
              href="/platform/procurement"
            >
              العودة إلى طلبات المشتريات
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <ProcurementCreateForm
      defaultCurrency={
        workspaceContext.workspace.defaultCurrency
      }
      draftNumber={createDraftNumber()}
    />
  );
}
