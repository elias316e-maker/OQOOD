import type { OpportunityItemInput } from "../../../actions/manage-opportunity-setup";
import { OpportunityBoqForm } from "../../opportunity-boq-form";

import {
  OpportunityKpiGrid,
} from "../dashboard";

import {
  WorkspaceCard,
  WorkspaceSectionHeader,
} from "../shared";

type OpportunityBoqWorkspaceProps = {
  opportunity: {
    id: string;
    number: string;
    title: string;
  };
  items: OpportunityItemInput[];
};

export function OpportunityBoqWorkspace({
  opportunity,
  items,
}: OpportunityBoqWorkspaceProps) {
  const completedItems = items.filter(
    (item) =>
      item.description.trim().length > 0 &&
      Number(item.quantity) > 0,
  ).length;

  const totalQuantity = items.reduce(
    (total, item) =>
      total + (Number(item.quantity) || 0),
    0,
  );

  const completionPercentage = items.length
    ? Math.round(
        (completedItems / items.length) * 100,
      )
    : 0;

  return (
    <main className="opportunityBoqWorkspace">
      <OpportunityKpiGrid
        items={[
          {
            label: "إجمالي البنود",
            value: String(items.length),
            helper: "جميع بنود جدول الكميات",
            icon: "▤",
            tone: "purple",
          },
          {
            label: "البنود المكتملة",
            value: String(completedItems),
            helper: "تحتوي وصفًا وكمية صالحة",
            icon: "✓",
            tone: "green",
          },
          {
            label: "إجمالي الكميات",
            value: totalQuantity.toLocaleString("ar-SA"),
            helper: "مجموع الكميات المسجلة",
            icon: "∑",
            tone: "blue",
          },
          {
            label: "نسبة الاكتمال",
            value: `${completionPercentage}%`,
            helper: "جاهزية جدول الكميات",
            icon: "%",
            tone: "amber",
          },
        ]}
      />

      <WorkspaceCard>
        <WorkspaceSectionHeader
          eyebrow="جدول الكميات"
          title="إدارة بنود المنافسة"
          description="أضف البنود والكميات والوحدات والمواصفات المطلوبة، ثم احفظ التغييرات من النموذج أدناه."
        />
      </WorkspaceCard>

      <div className="opportunityBoqWorkspace__form">
        <OpportunityBoqForm
          opportunity={opportunity}
          initialItems={items}
        />
      </div>
    </main>
  );
}
