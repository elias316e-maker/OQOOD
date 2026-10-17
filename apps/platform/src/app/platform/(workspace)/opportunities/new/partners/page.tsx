import styles from "../../page.module.css";
import Link from "next/link";
import {
  DashboardPanel,
  FormActions,
  FormGuidance,
  WorkspaceHeader,
} from "@oqood/design-system";

export default function PartnersPage() {
  return (
    <main className={styles.page}>
      <WorkspaceHeader
        eyebrow="إعداد المنافسة"
        title="شركاء الأعمال"
        description="حدد شركاء الأعمال من داخل المنافسة المحفوظة."
      />
      <DashboardPanel>
        <FormGuidance
          title="احفظ مسودة المنافسة أولًا"
          description="أنشئ المنافسة واحفظ بياناتها الأساسية، ثم افتح قسم الشركاء من تفاصيلها لتحديد الشركات وإعداد رسالة الدعوة. وللمنافسات الموجودة، افتح المنافسة من القائمة."
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
