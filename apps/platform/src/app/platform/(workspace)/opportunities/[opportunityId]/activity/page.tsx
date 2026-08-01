import {
  getOpportunityAction,
} from "@/features/opportunity/actions";

import {
  OpportunityActivityWorkspace,
} from "@/features/opportunity/components";

type OpportunityActivityPageProps = {
  params: Promise<{
    opportunityId: string;
  }>;
};

const statusLabels = {
  DRAFT: "مسودة",
  PENDING_APPROVAL: "بانتظار الاعتماد",
  APPROVED: "معتمدة",
  PUBLISHED: "منشورة",
  CLARIFICATION: "مرحلة الاستفسارات",
  SUBMISSION_CLOSED: "أغلق التقديم",
  TECHNICAL_EVALUATION: "تقييم فني",
  FINANCIAL_EVALUATION: "تقييم مالي",
  NEGOTIATION: "تفاوض",
  AWARD_PENDING: "بانتظار الترسية",
  AWARDED: "تمت الترسية",
  CANCELLED: "ملغاة",
  CLOSED: "مغلقة",
  ARCHIVED: "مؤرشفة",
} as const;

function formatDate(value: string | null) {
  if (!value) {
    return "غير محدد";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "غير محدد";
  }

  return new Intl.DateTimeFormat("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export default async function OpportunityActivityPage({
  params,
}: OpportunityActivityPageProps) {
  const { opportunityId } = await params;

  const result = await getOpportunityAction({
    opportunityId,
  });

  if (!result.success) {
    return (
      <main className="opportunityWorkspaceSection">
        <section className="opportunityWorkspaceEmptyPanel">
          <h1>تعذر تحميل نشاط المنافسة</h1>
          <p>{result.message}</p>
        </section>
      </main>
    );
  }

  const opportunity = result.data;

  return (
    <OpportunityActivityWorkspace
      opportunity={{
        number: opportunity.number,
        statusLabel: statusLabels[opportunity.status],
        createdAt: formatDate(opportunity.createdAt),
        updatedAt: formatDate(opportunity.updatedAt),
        issueDate: opportunity.issueDate
          ? formatDate(opportunity.issueDate)
          : null,
        closingDate: opportunity.closingDate
          ? formatDate(opportunity.closingDate)
          : null,
      }}
    />
  );
}
