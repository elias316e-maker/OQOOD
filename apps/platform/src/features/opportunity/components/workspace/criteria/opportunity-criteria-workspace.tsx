import type {
  OpportunityCriterionResponse,
} from "../../../dtos";

import {
  OpportunityKpiGrid,
} from "../dashboard";

import {
  WorkspaceCard,
  WorkspaceSectionHeader,
} from "../shared";

import {
  OpportunityCriteriaManager,
} from "./opportunity-criteria-manager";

type OpportunityCriteriaWorkspaceProps = {
  opportunityId: string;
  criteria: OpportunityCriterionResponse[];
  totalWeight: string;
  canManage: boolean;
};

export function OpportunityCriteriaWorkspace({
  opportunityId,
  criteria,
  totalWeight,
  canManage,
}: OpportunityCriteriaWorkspaceProps) {
  const activeCriteria = criteria.filter(
    (criterion) => criterion.active,
  );

  const requiredCriteria = criteria.filter(
    (criterion) => criterion.required,
  );

  const technicalWeight = criteria
    .filter(
      (criterion) =>
        criterion.active &&
        criterion.category === "TECHNICAL",
    )
    .reduce(
      (total, criterion) =>
        total + Number(criterion.weight),
      0,
    );

  return (
    <main className="opportunityCriteriaWorkspace">
      <OpportunityKpiGrid
        items={[
          {
            label: "عدد المعايير",
            value: String(criteria.length),
            helper: "جميع معايير المنافسة",
            icon: "✓",
            tone: "purple",
          },
          {
            label: "إجمالي الأوزان",
            value: `${Number(totalWeight)}%`,
            helper: "يجب ألا يتجاوز 100%",
            icon: "%",
            tone:
              Number(totalWeight) === 100
                ? "green"
                : "amber",
          },
          {
            label: "الوزن الفني",
            value: `${technicalWeight}%`,
            helper: "المعايير الفنية النشطة",
            icon: "◇",
            tone: "blue",
          },
          {
            label: "المعايير الإلزامية",
            value: String(requiredCriteria.length),
            helper: `${activeCriteria.length} معيار نشط`,
            icon: "!",
            tone: "amber",
          },
        ]}
      />

      <WorkspaceCard>
        <WorkspaceSectionHeader
          eyebrow="معلومات داخلية خاصة"
          title="معايير القبول والتقييم"
          description="إدارة المعايير الفنية والمالية والتجارية، والأوزان، وحدود النجاح، والمتطلبات الإلزامية للمنافسة."
        />
      </WorkspaceCard>

      <OpportunityCriteriaManager
        opportunityId={opportunityId}
        criteria={criteria}
        totalWeight={totalWeight}
        canManage={canManage}
      />
    </main>
  );
}
