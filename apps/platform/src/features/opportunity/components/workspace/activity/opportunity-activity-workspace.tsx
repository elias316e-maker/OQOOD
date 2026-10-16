import styles from "./opportunity-activity-workspace.module.css";

import {
  OpportunityKpiGrid,
} from "../dashboard";

import {
  FormGuidance,
  FormSection,
} from "@oqood/design-system";


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
    <div className={styles.workspace}>
      <OpportunityKpiGrid
        items={[
          {
            label: "عناصر الملخص",
            value: String(activities.length),
            helper: "مستخلصة من بيانات المنافسة",
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

      <FormSection
      eyebrow="ملخص بيانات المنافسة"
      title="نشاط المنافسة"
      description="تواريخ المنافسة وحالتها الحالية حسب البيانات المتاحة."
    >
      <FormGuidance
          title="ملخص البيانات المتاحة"
          description="يعرض هذا القسم تاريخ الإنشاء وآخر تحديث والحالة والمواعيد المحددة للمنافسة. سجل العمليات التفصيلي غير متاح حاليًا."
        />
    </FormSection>

      <FormSection
      eyebrow="التواريخ والحالة"
      title="ملخص النشاط"
      description="بيانات الإنشاء والتحديث والمرحلة الحالية ومواعيد المنافسة."
    >
      <ul className={styles.timeline}>
          {activities.map((activity, index) => (
            <li
              className={styles.item}
              key={`${activity.title}-${index}`}
            >
              <span
                className={styles.marker}
                aria-hidden="true"
              />

              <div>
                <header>
                  <strong>{activity.title}</strong>
                  <time>{activity.date}</time>
                </header>

                <p>{activity.description}</p>
              </div>
            </li>
          ))}
        </ul>
    </FormSection>
    </div>
  );
}
