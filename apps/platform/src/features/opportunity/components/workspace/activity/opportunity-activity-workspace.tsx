import {
  OpportunityKpiGrid,
} from "../dashboard";

import {
  WorkspaceCard,
  WorkspaceSectionHeader,
} from "../shared";

type OpportunityActivityItem = {
  title: string;
  description: string;
  date: string;
  tone: "purple" | "blue" | "green" | "amber";
};

type OpportunityActivityWorkspaceProps = {
  opportunity: {
    number: string;
    statusLabel: string;
    createdAt: string;
    updatedAt: string;
    issueDate: string | null;
    closingDate: string | null;
  };
};

export function OpportunityActivityWorkspace({
  opportunity,
}: OpportunityActivityWorkspaceProps) {
  const activities: OpportunityActivityItem[] = [
    {
      title: "تم إنشاء المنافسة",
      description: `إنشاء المنافسة رقم ${opportunity.number}.`,
      date: opportunity.createdAt,
      tone: "purple",
    },
    {
      title: "آخر تحديث",
      description: "تم تحديث بيانات المنافسة.",
      date: opportunity.updatedAt,
      tone: "blue",
    },
    {
      title: "المرحلة الحالية",
      description: opportunity.statusLabel,
      date: opportunity.updatedAt,
      tone: "green",
    },
  ];

  if (opportunity.issueDate) {
    activities.push({
      title: "تاريخ الإصدار",
      description: "تم تحديد تاريخ إصدار المنافسة.",
      date: opportunity.issueDate,
      tone: "amber",
    });
  }

  if (opportunity.closingDate) {
    activities.push({
      title: "موعد الإغلاق",
      description: "تم تحديد آخر موعد لتقديم العروض.",
      date: opportunity.closingDate,
      tone: "amber",
    });
  }

  return (
    <main className="opportunityActivityWorkspace">
      <OpportunityKpiGrid
        items={[
          {
            label: "إجمالي الأحداث",
            value: String(activities.length),
            helper: "الأحداث المتاحة حاليًا",
            icon: "◷",
            tone: "purple",
          },
          {
            label: "آخر تحديث",
            value: opportunity.updatedAt,
            helper: "آخر تعديل مسجل",
            icon: "↻",
            tone: "blue",
          },
          {
            label: "الحالة الحالية",
            value: opportunity.statusLabel,
            helper: "مرحلة المنافسة الحالية",
            icon: "✓",
            tone: "green",
          },
          {
            label: "سجل التدقيق",
            value: "قيد الربط",
            helper: "سيعرض جميع العمليات لاحقًا",
            icon: "⌁",
            tone: "amber",
          },
        ]}
      />

      <WorkspaceCard>
        <WorkspaceSectionHeader
          eyebrow="سجل العمليات"
          title="نشاط المنافسة"
          description="سجل زمني للتغييرات والإجراءات والمراحل المرتبطة بالمنافسة."
        />

        <div className="opportunityActivityWorkspace__notice">
          <strong>البيانات الحالية محدودة</strong>
          <p>
            يعرض هذا القسم الأحداث المستخلصة من بيانات المنافسة
            الحالية. سجل التدقيق الكامل يحتاج إلى ربط Audit Log.
          </p>
        </div>
      </WorkspaceCard>

      <WorkspaceCard>
        <div className="opportunityActivityTimeline">
          {activities.map((activity, index) => (
            <article
              className={`opportunityActivityTimeline__item is-${activity.tone}`}
              key={`${activity.title}-${index}`}
            >
              <span
                className="opportunityActivityTimeline__marker"
                aria-hidden="true"
              />

              <div>
                <header>
                  <strong>{activity.title}</strong>
                  <time>{activity.date}</time>
                </header>

                <p>{activity.description}</p>
              </div>
            </article>
          ))}
        </div>
      </WorkspaceCard>
    </main>
  );
}
