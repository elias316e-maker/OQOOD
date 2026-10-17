import styles from "../../page.module.css";
import Link from "next/link";
import {
  DashboardPanel,
  FormActions,
  FormGuidance,
  WorkspaceHeader,
} from "@oqood/design-system";

export default function BoqPage() {
  return (
    <main className={styles.page}>
      <WorkspaceHeader
        eyebrow="إعداد المنافسة"
        title="جدول الكميات"
        description="أضف البنود والكميات والمواصفات إلى مسودة المنافسة."
      />
      <DashboardPanel>
        <FormGuidance
          title="احفظ مسودة المنافسة أولًا"
          description="أنشئ المنافسة واحفظ بياناتها الأساسية، ثم افتح قسم جدول الكميات من تفاصيلها لإضافة البنود وحفظها. وللمنافسات الموجودة، افتح المنافسة من القائمة."
        />
        <FormActions>
          <Link
            className="odsButton odsButton--ghost odsButton--md"
            href="/platform/opportunities"
          >
            قائمة المنافسات
          </Link>
          <Link
            className="odsButton odsButton--primary odsButton--md"
            href="/platform/opportunities/new"
          >
            إنشاء مسودة المنافسة
          </Link>
        </FormActions>
      </DashboardPanel>
    </main>
  );
}
