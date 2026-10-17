import type { DashboardHeroData } from "@/features/dashboard";
import { PriorityAlerts } from "./priority-alerts";
import { TodayProgressCard } from "./today-progress-card";

type HeroCommandCenterProps = {
  data: DashboardHeroData;
};

export function HeroCommandCenter({
  data,
}: HeroCommandCenterProps) {
  return (
    <section className="commandHero">
      <div className="commandHero__glow commandHero__glow--one" />
      <div className="commandHero__glow commandHero__glow--two" />
      <div className="commandHero__grid" />

      <div className="commandHero__content">
        <div className="commandHero__intro">
          <div className="commandHero__date">
            <span className="commandHero__statusDot" />
            {data.dateLabel}
          </div>

          <p className="commandHero__greeting">
            {data.greeting}، {data.userName} 👋
          </p>

          <h1>{data.headline}</h1>

          <p className="commandHero__description">
            {data.description}
          </p>

          <PriorityAlerts alerts={data.alerts} />
        </div>

        <TodayProgressCard progress={data.progress} />
      </div>
    </section>
  );
}
