import styles from "./opportunity-inquiries-workspace.module.css";
import Link from "next/link";
import { EmptyState, FormSection } from "@oqood/design-system";

type OpportunityInquiriesWorkspaceProps = {
  opportunityId: string;
  canManage: boolean;
};

export function OpportunityInquiriesWorkspace({
  opportunityId,
  canManage,
}: OpportunityInquiriesWorkspaceProps) {
  return (
    <main className={styles.workspace}>
      <FormSection
        eyebrow="الأسئلة والتوضيحات"
        title="استفسارات المنافسة"
        description="استفسارات الموردين والردود الرسمية المتعلقة بالمنافسة."
      >
        <EmptyState
          title="الاستفسارات غير متاحة حاليًا"
          description="إرسال الاستفسارات والرد عليها غير متاح من هذه الصفحة حاليًا."
          actions={
            canManage ? (
              <Link
                className="odsButton odsButton--ghost odsButton--md"
                href={`/platform/opportunities/${opportunityId}/edit`}
              >
                تعديل بيانات المنافسة
              </Link>
            ) : undefined
          }
        />
      </FormSection>
    </main>
  );
}
