type OpportunityLifecycleStage = {
  label: string;
};

type OpportunityLifecycleCardProps = {
  stages: readonly OpportunityLifecycleStage[];
  activeIndex: number;
  statusLabel: string;
};

export function OpportunityLifecycleCard({
  stages,
  activeIndex,
  statusLabel,
}: OpportunityLifecycleCardProps) {
  const normalizedIndex = Math.min(
    Math.max(activeIndex, 0),
    Math.max(stages.length - 1, 0),
  );

  return (
    <article className="opportunityWorkspaceCard opportunityLifecycleCardV2">
      <header className="workspaceSectionHeader">
        <div>
          <span className="opportunityDashboardCardEyebrow">
            دورة حياة المنافسة
          </span>

          <h2>مسار المنافسة</h2>

          <p>
            تتبع المرحلة الحالية والمراحل المكتملة والمتبقية حتى الترسية.
          </p>
        </div>

        <span className="opportunityLifecycleCardV2__status">
          {statusLabel}
        </span>
      </header>

      <div
        className="opportunityLifecycleCardV2__track"
        aria-label={`المرحلة الحالية: ${statusLabel}`}
      >
        {stages.map((stage, index) => {
          const completed = index < normalizedIndex;
          const active = index === normalizedIndex;

          return (
            <div
              className={[
                "opportunityLifecycleCardV2__stage",
                completed ? "is-completed" : "",
                active ? "is-active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              key={`${stage.label}-${index}`}
            >
              <div className="opportunityLifecycleCardV2__marker">
                <span aria-hidden="true">
                  {completed ? "✓" : index + 1}
                </span>
              </div>

              <strong>{stage.label}</strong>

              <small>
                {completed
                  ? "مكتملة"
                  : active
                    ? "المرحلة الحالية"
                    : "قادمة"}
              </small>
            </div>
          );
        })}
      </div>
    </article>
  );
}
