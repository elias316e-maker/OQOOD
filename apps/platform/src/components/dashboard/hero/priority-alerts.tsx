import type { DashboardAlert } from "@/features/dashboard";

type PriorityAlertsProps = {
  alerts: DashboardAlert[];
};

export function PriorityAlerts({
  alerts,
}: PriorityAlertsProps) {
  return (
    <div className="commandHeroAlerts">
      {alerts.map((alert) => (
        <article
          className={`commandHeroAlert commandHeroAlert--${alert.tone}`}
          key={alert.id}
        >
          <span className="commandHeroAlert__icon" aria-hidden="true">
            {alert.icon}
          </span>

          <span className="commandHeroAlert__content">
            <strong>{alert.value}</strong>
            <span>{alert.label}</span>
            <small>{alert.description}</small>
          </span>
        </article>
      ))}
    </div>
  );
}
