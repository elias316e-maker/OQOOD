import {
  LinkedDocuments,
} from "@/features/documents/linked-documents";

import {
  FormSection,
} from "@oqood/design-system";


import {
  OpportunityKpiGrid,
} from "../dashboard";

type OpportunityAttachmentsWorkspaceProps = {
  opportunityId: string;
  workspaceId: string;
  canManage: boolean;
};

export function OpportunityAttachmentsWorkspace({
  opportunityId,
  workspaceId,
  canManage,
}: OpportunityAttachmentsWorkspaceProps) {
  return (
    <main className="opportunityAttachmentsWorkspace">
      <OpportunityKpiGrid
        items={[
          {
            label: "مستندات المنافسة",
            value: "—",
            helper: "الشروط والمواصفات",
            icon: "▱",
            tone: "purple",
          },
          {
            label: "الرسومات",
            value: "—",
            helper: "المخططات والرسومات",
            icon: "⌗",
            tone: "blue",
          },
          {
            label: "الجداول",
            value: "—",
            helper: "جدول الكميات والملفات الفنية",
            icon: "▤",
            tone: "green",
          },
          {
            label: "المراسلات",
            value: "—",
            helper: "التعاميم والإضافات",
            icon: "✉",
            tone: "amber",
          },
        ]}
      />

      <FormSection
      eyebrow="وثائق المنافسة"
      title="المرفقات والملفات"
      description="إدارة مستندات المنافسة والمواصفات والرسومات والجداول والمراسلات المرتبطة بها."
    >

    </FormSection>

      <section className="opportunityAttachmentsWorkspace__documents">
        <LinkedDocuments
          canManage={canManage}
          entityId={opportunityId}
          entityType="OPPORTUNITY"
          workspaceId={workspaceId}
        />
      </section>
    </main>
  );
}
