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
      <main className="platformContent">
        <section className="dashboardPanel opportunityVisiblePanel">
          <div className="emptyState" role="alert">
            <h1>تعذر تحميل المنافسة</h1>
            <p>{result.message}</p>

            <Link
              className="primaryButton compactButton"
              href="/platform/opportunities"
            >
              العودة إلى المنافسات
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const opportunity = result.data;

  const canUpdate = hasPermission(
    workspaceContext,
    Permissions.opportunities.update,
  );

  return (
    <div className="opportunityWorkspaceShell">
      <OpportunityWorkspaceHeader
        opportunity={opportunity}
        canUpdate={canUpdate}
        completionPercentage={calculateCompletion(opportunity)}
      />

      <OpportunityWorkspaceNavigation
        opportunityId={opportunity.id}
      />

      <div className="opportunityWorkspaceContent">
        {children}
      </div>
    </div>
  );
}
