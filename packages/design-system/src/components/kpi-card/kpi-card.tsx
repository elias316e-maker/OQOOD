import type { HTMLAttributes, ReactNode } from "react";

export type KpiTrend = "up" | "down" | "neutral";
export type KpiTone = "primary" | "success" | "warning" | "danger" | "info";

export type KpiCardProps = HTMLAttributes<HTMLElement> & {
  label: ReactNode;
  value: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  trend?: KpiTrend;
  trendLabel?: ReactNode;
  tone?: KpiTone;
  action?: ReactNode;
};

export function KpiCard({
  label,
  value,
  description,
  icon,
  trend = "neutral",
  trendLabel,
  tone = "primary",
  action,
  className = "",
  ...props
}: KpiCardProps) {
  return (
    <article
      className={[
        "odsKpiCard",
        `odsKpiCard--${tone}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      <div className="odsKpiCard__header">
        <span className="odsKpiCard__label">{label}</span>

        {action ? (
          <span className="odsKpiCard__action">{action}</span>
        ) : null}
      </div>

      <div className="odsKpiCard__main">
        <div>
          <strong className="odsKpiCard__value">{value}</strong>

          {description ? (
            <span className="odsKpiCard__description">
              {description}
            </span>
          ) : null}
        </div>

        {icon ? (
          <span className="odsKpiCard__icon" aria-hidden="true">
            {icon}
          </span>
        ) : null}
      </div>

      {trendLabel ? (
        <div
          className={[
            "odsKpiCard__trend",
            `odsKpiCard__trend--${trend}`,
          ].join(" ")}
        >
          <span aria-hidden="true">
            {trend === "up" ? "↗" : trend === "down" ? "↘" : "→"}
          </span>

          <span>{trendLabel}</span>
        </div>
      ) : null}
    </article>
  );
}
