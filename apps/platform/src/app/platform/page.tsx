import { PerformanceAnalytics } from "@/components/command-center/performance";
import { ActivityTimeline } from "@/components/command-center/activity";
import { CommandHero } from "@/components/command-center/hero";
import { IntelligencePanel } from "@/components/command-center/intelligence";
import { KpiStrip } from "@/components/command-center/kpi";
import { OpportunitiesCalendar } from "@/components/command-center/opportunities";
import { PipelineTasks } from "@/components/command-center/operations";
import { QuickActions } from "@/components/command-center/quick-actions";
import { commandCenterData } from "@/features/command-center";
import styles from "./page.module.css";

export default function PlatformPage() {
  const { operations } = commandCenterData;

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

      <PipelineTasks
        pipeline={operations.pipeline}
        tasks={operations.tasks}
      />

      <OpportunitiesCalendar
        events={operations.events}
        opportunities={operations.opportunities}
      />

      <section className={styles.performanceRow}>
        <PerformanceAnalytics
          data={commandCenterData.performance}
        />

        <ActivityTimeline
          data={commandCenterData.activity}
        />
      </section>
    </main>
  );
}
