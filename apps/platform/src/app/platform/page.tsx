import { CommandHero } from "@/components/command-center/hero";
import { IntelligencePanel } from "@/components/command-center/intelligence";
import { KpiStrip } from "@/components/command-center/kpi";
import { QuickActions } from "@/components/command-center/quick-actions";
import { commandCenterData } from "@/features/command-center";
import styles from "./page.module.css";

export default function PlatformPage() {
  return (
    <main className={styles.page}>
      <CommandHero data={commandCenterData} />

      <KpiStrip items={commandCenterData.kpis} />

      <section className={styles.intelligenceRow}>
        <IntelligencePanel
          data={commandCenterData.intelligence}
        />

        <QuickActions
          data={commandCenterData.quickActions}
        />
      </section>

      <section className={styles.placeholderGrid}>
        <article>
          <span>المرحلة التالية</span>
          <h2>مسار المنافسات والمهام</h2>
          <p>
            سيتم تنفيذ خط سير المنافسات والمهام اليومية
            في المرحلة التالية.
          </p>
        </article>

        <article>
          <span>المرحلة التالية</span>
          <h2>أحدث الفرص والتقويم</h2>
          <p>
            سيتم تنفيذ أحدث المنافسات والمواعيد والتقويم
            وفق التصميم المعتمد.
          </p>
        </article>
      </section>
    </main>
  );
}
