import { CommandHero } from "@/components/command-center/hero";
import { KpiStrip } from "@/components/command-center/kpi";
import { commandCenterData } from "@/features/command-center";
import styles from "./page.module.css";

export default function PlatformPage() {
  return (
    <main className={styles.page}>
      <CommandHero data={commandCenterData} />

      <KpiStrip items={commandCenterData.kpis} />

      <section className={styles.placeholderGrid}>
        <article>
          <span>المرحلة التالية</span>
          <h2>رؤى وتحليلات OQOOD AI</h2>
          <p>
            سيتم إضافة لوحة الذكاء الاصطناعي والإجراءات السريعة
            في الخطوة التالية.
          </p>
        </article>

        <article>
          <span>المرحلة التالية</span>
          <h2>مسار المنافسات والأنشطة</h2>
          <p>
            سيتم تطبيق بقية أقسام الصفحة وفق التصميم المعتمد.
          </p>
        </article>
      </section>
    </main>
  );
}
