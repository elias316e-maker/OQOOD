import {
  OpportunityPartnersForm,
} from "../../opportunity-partners-form";

import {
  FormSection,
} from "@oqood/design-system";


import {
  OpportunityKpiGrid,
} from "../dashboard";

type OpportunityPartnersWorkspaceProps = {
  opportunity: {
    id: string;
    number: string;
    title: string;
  };
  partners: Array<{
    id: string;
    name: string;
    city: string;
    trustScore: string;
    verified: boolean;
  }>;
  initialPartnerIds: string[];
  initialMessage: string;
};

export function OpportunityPartnersWorkspace({
  opportunity,
  partners,
  initialPartnerIds,
  initialMessage,
}: OpportunityPartnersWorkspaceProps) {
  const verifiedPartners = partners.filter(
    (partner) => partner.verified,
  ).length;

  return (
    <main className="opportunityPartnersWorkspace">
      <OpportunityKpiGrid
        items={[
          {
            label: "إجمالي الموردين",
            value: String(partners.length),
            helper: "الموردون المؤهلون",
            icon: "◫",
            tone: "purple",
          },
          {
            label: "الموردون المعتمدون",
            value: String(verifiedPartners),
            helper: "الحسابات الموثقة",
            icon: "✓",
            tone: "green",
          },
          {
            label: "الدعوات الحالية",
            value: String(initialPartnerIds.length),
            helper: "سيتم إرسالها عند النشر",
            icon: "✉",
            tone: "blue",
          },
          {
            label: "رسالة الدعوة",
            value: initialMessage.trim()
              ? "جاهزة"
              : "غير محددة",
            helper: "النص الموحد للموردين",
            icon: "✎",
            tone: "amber",
          },
        ]}
      />

      <FormSection
      eyebrow="الموردون"
      title="إدارة دعوات المنافسة"
      description="اختر الموردين المؤهلين لإرسال الدعوات، وحدد الرسالة الموحدة التي ستصل إليهم عند نشر المنافسة."
    />

      <div className="opportunityPartnersWorkspace__form">
        <OpportunityPartnersForm
          opportunity={opportunity}
          partners={partners}
          initialPartnerIds={initialPartnerIds}
          initialMessage={initialMessage}
        />
      </div>
    </main>
  );
}
