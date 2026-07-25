import Link from "next/link";
import { notFound } from "next/navigation";

import {
  hasPermission,
  Permissions,
} from "@/lib/permissions";

import {
  requireCurrentWorkspace,
} from "@/lib/workspace-context";


import {
  getOpportunityAction,
} from "@/features/opportunity/actions/get-opportunity";

import {
  OpportunityEditForm,
} from "@/features/opportunity/components";

type OpportunityEditPageProps = {
  params: Promise<{
    opportunityId: string;
  }>;
};

export default async function OpportunityEditPage({
  params,
}: OpportunityEditPageProps) {
  const { opportunityId } = await params;

  const [result, workspaceContext] =
    await Promise.all([
      getOpportunityAction({
        opportunityId,
      }),
      requireCurrentWorkspace(),
    ]);

  const canUpdate = hasPermission(
    workspaceContext,
    Permissions.opportunities.update,
  );

  if (!canUpdate) {
    return (
      <main className="platformContent">
        <section className="dashboardPanel opportunityVisiblePanel">
          <div
            className="emptyState"
            role="alert"
            aria-live="polite"
          >
            <h1>ليس لديك صلاحية تعديل الفرص</h1>

            <p>
              لا يسمح دورك الحالي بتعديل بيانات الفرصة.
            </p>

            <Link
              className="primaryButton compactButton"
              href={
                `/platform/opportunities/` +
                opportunityId
              }
            >
              العودة إلى تفاصيل الفرصة
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (!result.success) {
    if (
      result.message.includes("غير موجود") ||
      result.message.includes(
        "لم يتم العثور",
      )
    ) {
      notFound();
    }

    return (
      <main className="platformContent">
        <section className="dashboardPanel opportunityVisiblePanel">
          <div
            className="emptyState"
            role="alert"
          >
            <h1>
              تعذر تحميل بيانات الفرصة
            </h1>

            <p>{result.message}</p>

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
    <OpportunityEditForm
      opportunity={result.data}
    />
  );
}
