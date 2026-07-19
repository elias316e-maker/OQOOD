import type { ReactNode } from "react";

export type ProcurementPipelineItem = {
  id: string;
  label: ReactNode;
  value: ReactNode;
  description?: ReactNode;
  tone?: "primary" | "info" | "warning" | "success" | "neutral";
};

export type ProcurementPipelineProps = {
  items: ProcurementPipelineItem[];
  className?: string;
};

export function ProcurementPipeline({
  items,
  className = "",
}: ProcurementPipelineProps) {
  return (
    <div
      className={[
        "odsProcurementPipeline",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {items.map((item, index) => (
        <div
          className={[
            "odsProcurementPipeline__item",
            `odsProcurementPipeline__item--${item.tone ?? "neutral"}`,
          ].join(" ")}
          key={item.id}
        >
          <div className="odsProcurementPipeline__position">
            {index + 1}
          </div>

          <span className="odsProcurementPipeline__label">
            {item.label}
          </span>

          <strong className="odsProcurementPipeline__value">
            {item.value}
          </strong>

          {item.description ? (
            <small className="odsProcurementPipeline__description">
              {item.description}
            </small>
          ) : null}
        </div>
      ))}
    </div>
  );
}
