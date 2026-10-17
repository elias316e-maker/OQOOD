import styles from "./opportunity-attachments-workspace.module.css";
import { LinkedDocuments } from "@/features/documents/linked-documents";
import { FormSection } from "@oqood/design-system";

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
    <main className={styles.workspace}>
      <FormSection
        eyebrow="وثائق المنافسة"
        title="المرفقات والملفات"
        description="إدارة مستندات المنافسة والمواصفات والرسومات والجداول والمراسلات المرتبطة بها."
      >
        <div className={styles.documents}>
          <LinkedDocuments
            canManage={canManage}
            entityId={opportunityId}
            entityType="OPPORTUNITY"
            workspaceId={workspaceId}
          />
        </div>
      </FormSection>
    </main>
  );
}
