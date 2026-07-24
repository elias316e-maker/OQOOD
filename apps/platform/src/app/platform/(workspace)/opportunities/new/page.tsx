import Link from "next/link";

import {
  OpportunityCreateForm,
} from "@/features/opportunity/components";

import {
  hasPermission,
  Permissions,
} from "@/lib/permissions";

import {
  requireCurrentWorkspace,
} from "@/lib/workspace-context";

function createDraftNumber(): string {
  const timestamp = Date.now()
    .toString()
    .slice(-8);

  const randomPart = Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase();

  return `RFQ-${timestamp}-${randomPart}`;
}

export default async function NewOpportunityPage() {
  const workspaceContext =
    await requireCurrentWorkspace();

  const canCreate = hasPermission(
    workspaceContext,
    Permissions.opportunities.create,
  );

  if (!canCreate) {
    return (
      <main className="platformContent">
        <section className="dashboardPanel">
          <div
            className="emptyState"
            role="alert"
            aria-live="polite"
          >
            <h1>ليس لديك صلاحية إنشاء الفرص</h1>

            <p>
              تواصل مع مسؤول مساحة العمل للحصول على
              الصلاحية المطلوبة.
            </p>

            <Link
              className="primaryButton compactButton"
              href="/platform/opportunities"
            >
              العودة إلى قائمة الفرص
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <OpportunityCreateForm
      draftNumber={createDraftNumber()}
    />
  );
}
