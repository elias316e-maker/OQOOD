import Link from "next/link";

import {
  EmptyState,
} from "@oqood/design-system";

import styles from "./partner-scorecard.module.css";

export default function PartnerNotFound() {
  return (
    <main className={styles.page}>
      <EmptyState
        className={styles.routeState}
        tone="info"
        icon="♧"
        title="شريك الأعمال غير موجود"
        description="قد يكون السجل قد حُذف، أو لا ينتمي إلى مساحة العمل الحالية، أو أن الرابط المستخدم غير صحيح."
        role="status"
        actions={
          <Link
            className={styles.back}
            href="/platform/partners"
          >
            العودة إلى دليل الشركاء
          </Link>
        }
      />
    </main>
  );
}
