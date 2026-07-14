import { Button } from "@oqood/design-system";
import type { DashboardProgress } from "@/features/dashboard";

type TodayProgressCardProps = {
  progress: DashboardProgress;
};

export function TodayProgressCard({
  progress,
}: TodayProgressCardProps) {
  return (
    <aside className="commandHeroProgress">
      <header>
        <span>{progress.label}</span>
        <small>يتم التحديث تلقائيًا</small>
      </header>

      <div className="commandHeroProgress__value">
        <strong>{progress.percentage}%</strong>

        <div
          aria-label={`نسبة الإنجاز ${progress.percentage}%`}
          className="commandHeroProgress__ring"
          role="img"
          style={
            {
              "--progress": `${progress.percentage * 3.6}deg`,
            } as React.CSSProperties
          }
        >
          <span>{progress.percentage}%</span>
        </div>
      </div>

      <div className="commandHeroProgress__track">
        <span
          style={{
            width: `${progress.percentage}%`,
          }}
        />
      </div>

      <p>
        تم إنجاز <strong>{progress.completed}</strong> من أصل{" "}
        <strong>{progress.total}</strong> مهمة اليوم.
      </p>

      <Button fullWidth size="md">
        ابدأ العمل
      </Button>
    </aside>
  );
}
