import styles from "../page.module.css";
import { DashboardPanel, EmptyState, WorkspaceHeader } from "@oqood/design-system";

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
      <main className={styles.page}>
        <WorkspaceHeader title="إنشاء منافسة" eyebrow="إدارة المنافسات" />
        <DashboardPanel>
          <EmptyState
            tone="danger"
            title="ليس لديك صلاحية إنشاء المنافسات"
            description="تواصل مع مسؤول مساحة العمل للحصول على الصلاحية المطلوبة."
            role="alert"
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
    <OpportunityCreateForm
      draftNumber={createDraftNumber()}
    />
  );
}
