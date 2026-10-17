import styles from "../page.module.css";
import Link from "next/link";
import {
  DashboardPanel,
  EmptyState,
  WorkspaceHeader,
} from "@oqood/design-system";

export default function OpportunityNotFound() {
  return (
    <main className={styles.page}>
      <WorkspaceHeader title="المنافسة غير موجودة" eyebrow="إدارة المنافسات" />
      <DashboardPanel>
        <EmptyState
          title="لم يتم العثور على المنافسة"
          description="قد تكون المنافسة حُذفت أو لم تعد متاحة داخل مساحة العمل الحالية."
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
