import Link from "next/link";

import {
  WorkspaceHeader,
} from "@oqood/design-system";

import {
  PartnerCreateForm,
} from "@/features/partner";

import styles from "./page.module.css";

export default function NewPartnerPage() {
  return (
    <main className={styles.page}>
      <WorkspaceHeader
        className={styles.header}
        eyebrow="دليل المنشأة"
        title="إضافة شريك أعمال"
        description="سجّل المورد أو المقاول أو مقدم الخدمة ليصبح متاحًا مباشرة في دعوات الفرص والمنافسات."
        actions={
          <Link
            className={styles.backAction}
            href="/platform/partners"
          >
            العودة إلى دليل الشركاء
          </Link>
        }
      />

      <PartnerCreateForm />
    </main>
  );
}
