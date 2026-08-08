type OpportunityPrivateField = {
  label: string;
  value: string;
  helper?: string;
};

type OpportunityPrivateInformationProps = {
  fields: readonly OpportunityPrivateField[];
  title?: string;
  description?: string;
};

export function OpportunityPrivateInformation({
  fields,
  title = "تفاصيل المنافسة",
  description =
    "البيانات الداخلية الخاصة بالمنافسة والمخصصة لفريق العمل.",
}: OpportunityPrivateInformationProps) {
  return (
    <article className="opportunityWorkspaceCard opportunityPrivateInformation">
      <header className="workspaceSectionHeader">
        <div>
          <span className="opportunityDashboardCardEyebrow">
            معلومات خاصة
          </span>

          <h2>{title}</h2>

          <p>{description}</p>
        </div>

        <span className="opportunityPrivateInformation__badge">
          للاستخدام الداخلي
        </span>
      </header>

      <dl className="opportunityPrivateInformation__grid">
        {fields.map((field) => (
          <div key={field.label}>
            <dt>{field.label}</dt>

            <dd>{field.value || "غير محدد"}</dd>

            {field.helper && (
              <small>{field.helper}</small>
            )}
          </div>
        ))}
      </dl>
    </article>
  );
}
