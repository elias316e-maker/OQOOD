import styles from "../page.module.css";
import shell from "./layout.module.css";
import { DashboardPanel, EmptyState, WorkspaceHeader } from "@oqood/design-system";

import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getOpportunityAction,
} from "@/features/opportunity/actions";

import {
  OpportunityWorkspaceHeader,
  OpportunityWorkspaceNavigation,
} from "@/features/opportunity/components";

import {
  hasPermission,
  Permissions,
} from "@/lib/permissions";

import {
  requireCurrentWorkspace,
} from "@/lib/workspace-context";

type OpportunityWorkspaceLayoutProps = {
  children: ReactNode;
  params: Promise<{
    opportunityId: string;
  }>;
};

function calculateCompletion(opportunity: {
  title: string;
  description: string | null;
  category: string | null;
  budget: string | null;
  issueDate: string | null;
  closingDate: string | null;
}) {
  const fields = [
    opportunity.title,
    opportunity.description,
    opportunity.category,
    opportunity.budget,
    opportunity.issueDate,
    opportunity.closingDate,
  ];

  const completed = fields.filter(
    (value) => value !== null && String(value).trim().length > 0,
  ).length;

  return Math.round((completed / fields.length) * 100);
}

export default async function OpportunityWorkspaceLayout({
  children,
  params,
}: OpportunityWorkspaceLayoutProps) {
  const { opportunityId } = await params;

  const [result, workspaceContext] = await Promise.all([
    getOpportunityAction({
      opportunityId,
    }),
    requireCurrentWorkspace(),
  ]);

  if (!result.success) {
    if (
      result.message.includes("غير موجود") ||
      result.message.includes("لم يتم العثور")
    ) {
      notFound();
    }

    return (
      <main className={styles.page}>
        <WorkspaceHeader title="المنافسة" eyebrow="إدارة المنافسات" />
        <DashboardPanel>
          <EmptyState
            tone="danger"
            role="alert"
            title="تعذر تحميل المنافسة"
            description={result.message}
            actions={
              <Link
                className="odsButton odsButton--primary odsButton--md"
                href="/platform/opportunities"
              >
                العودة إلى المنافسات
              </Link>
            }
          />
        </DashboardPanel>
      </main>
    );
  }

  const opportunity = result.data;

  const canUpdate = hasPermission(
    workspaceContext,
    Permissions.opportunities.update,
  );

  return (
    <div className={shell.shell}>
      <OpportunityWorkspaceHeader
        opportunity={opportunity}
        canUpdate={canUpdate}
        completionPercentage={calculateCompletion(opportunity)}
      />

      <OpportunityWorkspaceNavigation
        opportunityId={opportunity.id}
      />

      <div className={shell.content}>
        {children}
      </div>
    </div>
  );
}
