import Link from "next/link";

import {
  OpportunityKpiGrid,
} from "../dashboard";

import {
  WorkspaceCard,
  WorkspaceSectionHeader,
} from "../shared";

type OpportunityInquiriesWorkspaceProps = {
  opportunityId: string;
  canManage: boolean;
};

const previewInquiries = [
  {
    reference: "Q-001",
    subject: "مدة تنفيذ المشروع",
    sender: "مورد مدعو",
    status: "OPEN",
    updatedAt: "بانتظار الرد",
  },
  {
    reference: "Q-002",
    subject: "توضيح بند الضمان",
    sender: "مورد مدعو",
    status: "ANSWERED",
    updatedAt: "تم الرد",
  },
] as const;

const statusLabels = {
  OPEN: "مفتوح",
  ANSWERED: "تم الرد",
} as const;

export function OpportunityInquiriesWorkspace({
  opportunityId,
  canManage,
}: OpportunityInquiriesWorkspaceProps) {
  const openCount = previewInquiries.filter(
    (inquiry) => inquiry.status === "OPEN",
  ).length;

  const answeredCount = previewInquiries.filter(
    (inquiry) => inquiry.status === "ANSWERED",
  ).length;

  return (
    <main className="opportunityInquiriesWorkspace">
      <OpportunityKpiGrid
        items={[
          {
            label: "إجمالي الاستفسارات",
            value: String(previewInquiries.length),
            helper: "نموذج واجهة مؤقت",
            icon: "◌",
            tone: "purple",
          },
          {
            label: "بانتظار الرد",
            value: String(openCount),
            helper: "استفسارات مفتوحة",
            icon: "!",
            tone: "amber",
          },
          {
            label: "تم الرد",
            value: String(answeredCount),
            helper: "استفسارات مكتملة",
            icon: "✓",
            tone: "green",
          },
          {
            label: "التعاميم",
            value: "0",
            helper: "لا توجد تعاميم مسجلة",
            icon: "✉",
            tone: "blue",
          },
        ]}
      />

      <WorkspaceCard>
        <WorkspaceSectionHeader
          eyebrow="الأسئلة والتوضيحات"
          title="استفسارات المنافسة"
          description="متابعة استفسارات الموردين والردود الرسمية والتعاميم والإضافات المرتبطة بالمنافسة."
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

        <div className="opportunityInquiriesWorkspace__notice">
          <strong>واجهة جاهزة للربط</strong>
          <p>
            البيانات الظاهرة نموذج تصميم فقط حتى اعتماد نموذج
            الاستفسارات وخدمات الإنشاء والرد والنشر.
          </p>
        </div>
      </WorkspaceCard>

      <WorkspaceCard>
        <div className="opportunityInquiriesWorkspace__table">
          <table>
            <thead>
              <tr>
                <th>المرجع</th>
                <th>الموضوع</th>
                <th>المرسل</th>
                <th>الحالة</th>
                <th>آخر تحديث</th>
              </tr>
            </thead>

            <tbody>
              {previewInquiries.map((inquiry) => (
                <tr key={inquiry.reference}>
                  <td>
                    <strong>{inquiry.reference}</strong>
                  </td>

                  <td>{inquiry.subject}</td>

                  <td>{inquiry.sender}</td>

                  <td>
                    <span
                      className={
                        `opportunityInquiryStatus ` +
                        `status-${inquiry.status.toLowerCase()}`
                      }
                    >
                      {statusLabels[inquiry.status]}
                    </span>
                  </td>

                  <td>{inquiry.updatedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </WorkspaceCard>
    </main>
  );
}
