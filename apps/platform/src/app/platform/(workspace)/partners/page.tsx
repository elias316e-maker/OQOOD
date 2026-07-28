import Link from "next/link";

import { listPartnersAction } from "@/features/partner";

const roleLabels: Record<string, string> = {
  SUPPLIER: "مورد",
  CONTRACTOR: "مقاول",
  CONSULTANT: "استشاري",
  MANUFACTURER: "مصنع",
  DISTRIBUTOR: "موزع",
  SERVICE_PROVIDER: "مقدم خدمات",
  LOGISTICS_PROVIDER: "خدمات لوجستية",
  INVESTMENT_PARTNER: "شريك استثماري",
};

const verificationLabels: Record<string, string> = {
  UNVERIFIED: "غير موثق",
  PENDING: "قيد التحقق",
  VERIFIED: "موثق",
  REJECTED: "مرفوض",
};

export default async function PartnersPage() {
  const result = await listPartnersAction();
  const partners = result.success ? result.data : [];
  const verifiedCount = partners.filter(
    (partner) => partner.verificationStatus === "VERIFIED",
  ).length;
  const invitedCount = partners.filter(
    (partner) => partner.invitationCount > 0,
  ).length;

  return (
    <main className="platformContent partnerDirectoryPage partnerDirectoryRefresh">
      <header className="partnerDirectoryHeader">
        <div>
          <span className="pageEyebrow">دليل المنشأة</span>
          <h1>شركاء الأعمال والموردون</h1>
          <p>
            إدارة الموردين والمقاولين والاستشاريين
            وإتاحـتهم لدعوات الفرص.
          </p>
        </div>
        <Link
          className="primaryButton compactButton"
          href="/platform/partners/new"
        >
          + إضافة شريك أعمال
        </Link>
      </header>

      {result.success && (
        <section className="partnerDirectorySummary" aria-label="ملخص الموردين">
          <article><span>إجمالي الشركاء</span><strong>{partners.length}</strong><small>في مساحة العمل</small></article>
          <article><span>موردون موثقون</span><strong>{verifiedCount}</strong><small>{partners.length ? Math.round(verifiedCount / partners.length * 100) : 0}% من الدليل</small></article>
          <article><span>شاركوا في منافسات</span><strong>{invitedCount}</strong><small>لديهم دعوة واحدة أو أكثر</small></article>
        </section>
      )}

      {!result.success ? (
        <div className="opportunityFormAlert opportunityFormAlert--error">
          {result.message}
        </div>
      ) : result.data.length === 0 ? (
        <section className="partnerDirectoryPanel">
          <div className="emptyState">
            <h2>لا يوجد شركاء أعمال مسجلون</h2>
            <p>
              أضف المورد الأول ليظهر ضمن خيارات دعوة
              الشركات في الفرص.
            </p>
            <Link
              className="primaryButton compactButton"
              href="/platform/partners/new"
            >
              إضافة المورد الأول
            </Link>
          </div>
        </section>
      ) : (
        <section className="partnerDirectoryPanel">
          <div className="opportunitySection__head">
            <div>
              <span>إجمالي الشركاء</span>
            <h2>{result.data.length} شريك أعمال</h2>
            <small>اضغط على اسم الشركة لفتح بطاقة الأداء</small>
            </div>
          </div>
          <div className="oqDataTable">
            <div className="oqDataTableViewport">
            <table className="oqDataTableElement">
              <thead>
                <tr>
                  <th>الشركة</th>
                  <th>التصنيف</th>
                  <th>المدينة</th>
                  <th>التواصل</th>
                  <th>التوثيق</th>
                  <th>الدعوات</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((partner) => (
                  <tr key={partner.id}>
                    <td>
                      <strong className="partnerIdentityName"><span aria-hidden="true">{partner.nameAr.slice(0, 1)}</span><Link href={`/platform/partners/${partner.id}`}>{partner.nameAr}</Link></strong>
                      <small>
                        {partner.commercialRegister ||
                          partner.nameEn ||
                          "لا يوجد سجل تجاري"}
                      </small>
                    </td>
                    <td>
                      {partner.roles
                        .map(
                          (role) =>
                            roleLabels[role] ?? role,
                        )
                        .join("، ")}
                    </td>
                    <td>{partner.city || "—"}</td>
                    <td>
                      {partner.email ||
                        partner.phone ||
                        "—"}
                    </td>
                    <td>
                      {verificationLabels[
                        partner.verificationStatus
                      ] ?? partner.verificationStatus}
                    </td>
                    <td>{partner.invitationCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
