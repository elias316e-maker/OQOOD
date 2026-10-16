import styles from "./page.module.css";
import { DashboardPanel, EmptyState } from "@oqood/design-system";

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
      <main className={styles.state}>
        <DashboardPanel>
          <EmptyState
            tone="danger"
            role="alert"
            title="ليس لديك صلاحية تعديل المنافسة"
            description="لا يسمح دورك الحالي بتعديل بيانات المنافسة."
            actions={
              <Link
                className="odsButton odsButton--primary odsButton--md"
                href={`/platform/opportunities/${opportunityId}`}
              >
                العودة إلى تفاصيل المنافسة
              </Link>
            }
          />
        </DashboardPanel>
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
      <main className={styles.state}>
        <DashboardPanel>
          <EmptyState
            tone="danger"
            role="alert"
            title="تعذر تحميل بيانات المنافسة"
            description={result.message}
            actions={
              <Link
                className="odsButton odsButton--primary odsButton--md"
                href="/platform/opportunities"
              >
                العودة إلى قائمة المنافسات
              </Link>
            }
          />
        </DashboardPanel>
      </main>
    );
  }

  return (
    <OpportunityEditForm
      opportunity={result.data}
    />
  );
}
