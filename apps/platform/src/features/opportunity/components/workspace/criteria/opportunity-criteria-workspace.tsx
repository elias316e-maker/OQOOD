import Link from "next/link";

import {
  OpportunityKpiGrid,
} from "../dashboard";

import {
  WorkspaceCard,
  WorkspaceSectionHeader,
} from "../shared";

type OpportunityCriteriaWorkspaceProps = {
  opportunityId: string;
  canManage: boolean;
};

const previewCriteria = [
  {
    title: "التقييم الفني",
    weight: 40,
    helper: "الجودة والمنهجية والمواصفات الفنية",
    tone: "purple",
  },
  {
    title: "التقييم المالي",
    weight: 40,
    helper: "السعر الإجمالي وشروط الدفع",
    tone: "green",
  },
  {
    title: "الخبرة والتأهيل",
    weight: 20,
    helper: "الخبرات السابقة والقدرة التنفيذية",
    tone: "blue",
  },
] as const;

export function OpportunityCriteriaWorkspace({
  opportunityId,
  canManage,
}: OpportunityCriteriaWorkspaceProps) {
  const totalWeight = previewCriteria.reduce(
    (total, criterion) => total + criterion.weight,
    0,
  );

  return (
    <main className="opportunityCriteriaWorkspace">
      <OpportunityKpiGrid
        items={[
          {
            label: "عدد المعايير",
            value: String(previewCriteria.length),
            helper: "نموذج العرض المبدئي",
            icon: "✓",
            tone: "purple",
          },
          {
            label: "إجمالي الأوزان",
            value: `${totalWeight}%`,
            helper: "يجب أن يساوي 100%",
            icon: "%",
            tone: "green",
          },
          {
            label: "حد النجاح الفني",
            value: "غير محدد",
            helper: "لم يربط بقاعدة البيانات بعد",
            icon: "◇",
            tone: "amber",
          },
          {
            label: "المتطلبات الإلزامية",
            value: "غير محدد",
            helper: "ستضاف في مرحلة البيانات",
            icon: "!",
            tone: "blue",
          },
        ]}
      />

      <WorkspaceCard>
        <WorkspaceSectionHeader
          eyebrow="معلومات داخلية خاصة"
          title="معايير القبول والتقييم"
          description="تحديد المعايير الفنية والمالية والأوزان وحدود النجاح والمتطلبات الإلزامية للمنافسة."
          actions={
            canManage ? (
              <Link
                className="primaryButton compactButton"
                href={`/platform/opportunities/${opportunityId}/edit`}
              >
                إدارة بيانات المنافسة
              </Link>
            ) : undefined
          }
        />

        <div className="opportunityCriteriaWorkspace__notice">
          <strong>واجهة جاهزة للربط</strong>
          <p>
            المعايير الظاهرة نموذج تصميم فقط، ولا تحفظ حاليًا
            في قاعدة البيانات حتى اعتماد نموذج البيانات وخدمات الحفظ.
          </p>
        </div>
      </WorkspaceCard>

      <section className="opportunityCriteriaWorkspace__grid">
        {previewCriteria.map((criterion) => (
          <article
            className={`opportunityCriteriaCard is-${criterion.tone}`}
            key={criterion.title}
          >
            <header>
              <div>
                <span>معيار تقييم</span>
                <h2>{criterion.title}</h2>
              </div>

              <strong>{criterion.weight}%</strong>
            </header>

            <p>{criterion.helper}</p>

            <div className="opportunityCriteriaCard__progress">
              <span
                style={{
                  width: `${criterion.weight}%`,
                }}
              />
            </div>

            <footer>
              <span>نوع المعيار</span>
              <strong>
                {criterion.title === "التقييم المالي"
                  ? "مالي"
                  : "فني"}
              </strong>
            </footer>
          </article>
        ))}
      </section>

      <WorkspaceCard>
        <WorkspaceSectionHeader
          eyebrow="متطلبات التأهيل"
          title="الشروط الإلزامية"
          description="ستظهر هنا الشهادات والتصنيفات والخبرات والوثائق التي يجب أن يستوفيها المورد."
        />

        <div className="opportunityWorkspaceEmptyPanel opportunityCriteriaWorkspace__empty">
          <span className="opportunityWorkspaceEmptyPanel__icon">
            ✓
          </span>

          <h2>لم تربط متطلبات التأهيل بعد</h2>

          <p>
            يتطلب الحفظ الفعلي إضافة نموذج بيانات خاص بمعايير
            القبول وشروط التأهيل.
          </p>
        </div>
      </WorkspaceCard>
    </main>
  );
}
