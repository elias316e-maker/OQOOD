import Link from "next/link";

import {
  Alert,
  EmptyState,
  FormSection,
  WorkspaceHeader,
} from "@oqood/design-system";

import {
  listPartnersAction,
} from "@/features/partner";

import styles from "./partners.module.css";

const roleLabels: Record<
  string,
  string
> = {
  SUPPLIER: "مورد",
  CONTRACTOR: "مقاول",
  CONSULTANT: "استشاري",
  MANUFACTURER: "مصنع",
  DISTRIBUTOR: "موزع",
  SERVICE_PROVIDER: "مقدم خدمات",
  LOGISTICS_PROVIDER:
    "خدمات لوجستية",
  INVESTMENT_PARTNER:
    "شريك استثماري",
};

const verificationLabels: Record<
  string,
  string
> = {
  UNVERIFIED: "غير موثق",
  PENDING: "قيد التحقق",
  VERIFIED: "موثق",
  REJECTED: "مرفوض",
};

export default async function PartnersPage() {
  const result =
    await listPartnersAction();

  const partners = result.success
    ? result.data
    : [];

  const verifiedCount =
    partners.filter(
      (partner) =>
        partner.verificationStatus ===
        "VERIFIED",
    ).length;

  const invitedCount =
    partners.filter(
      (partner) =>
        partner.invitationCount > 0,
    ).length;

  const verificationRate =
    partners.length > 0
      ? Math.round(
          (
            verifiedCount /
            partners.length
          ) * 100,
        )
      : 0;

  return (
    <main className={styles.page}>
      <WorkspaceHeader
        className={styles.header}
        eyebrow="دليل المنشأة"
        title="شركاء الأعمال والموردون"
        description="إدارة الموردين والمقاولين والاستشاريين وإتاحتهم لدعوات الفرص والمنافسات."
        actions={
          <Link
            className={
              styles.primaryAction
            }
            href="/platform/partners/new"
          >
            إضافة شريك أعمال
          </Link>
        }
      />

      {result.success ? (
        <section
          aria-label="ملخص شركاء الأعمال"
          className={styles.summary}
        >
          <article>
            <span>
              إجمالي الشركاء
            </span>

            <strong>
              {partners.length}
            </strong>

            <small>
              في مساحة العمل
            </small>
          </article>

          <article>
            <span>
              شركاء موثقون
            </span>

            <strong>
              {verifiedCount}
            </strong>

            <small>
              {verificationRate}% من الدليل
            </small>
          </article>

          <article>
            <span>
              شاركوا في منافسات
            </span>

            <strong>
              {invitedCount}
            </strong>

            <small>
              لديهم دعوة واحدة أو أكثر
            </small>
          </article>
        </section>
      ) : null}

      {!result.success ? (
        <Alert
          className={styles.feedback}
          tone="danger"
          title="تعذر تحميل دليل الشركاء"
          aria-live="assertive"
        >
          <p>
            {result.message}
          </p>

          <Link
            className={styles.retryLink}
            href="/platform/partners"
          >
            إعادة المحاولة
          </Link>
        </Alert>
      ) : partners.length === 0 ? (
        <EmptyState
          className={styles.empty}
          tone="info"
          icon="♧"
          title="لا يوجد شركاء أعمال مسجلون"
          description="أضف المورد أو المقاول الأول ليظهر ضمن خيارات دعوة الشركات في الفرص والمنافسات."
          role="status"
          actions={
            <Link
              className={
                styles.primaryAction
              }
              href="/platform/partners/new"
            >
              إضافة الشريك الأول
            </Link>
          }
        />
      ) : (
        <FormSection
          className={styles.panel}
          eyebrow="الدليل الموحد"
          title={`${partners.length} شريك أعمال`}
          description="اضغط على اسم الشركة لفتح بطاقة الأداء والبيانات المرتبطة بها."
          actions={
            <small
              className={
                styles.panelMeta
              }
            >
              {verifiedCount} موثق
            </small>
          }
        >
          <div className={styles.tableWrap}>
            <table
              className={styles.table}
            >
              <caption
                className={styles.srOnly}
              >
                قائمة شركاء الأعمال
                والموردين في مساحة العمل
              </caption>

              <thead>
                <tr>
                  <th scope="col">
                    الشركة
                  </th>

                  <th scope="col">
                    التصنيف
                  </th>

                  <th scope="col">
                    المدينة
                  </th>

                  <th scope="col">
                    التواصل
                  </th>

                  <th scope="col">
                    التوثيق
                  </th>

                  <th scope="col">
                    الدعوات
                  </th>
                </tr>
              </thead>

              <tbody>
                {partners.map(
                  (partner) => {
                    const roles =
                      partner.roles
                        .map(
                          (role) =>
                            roleLabels[
                              role
                            ] ?? role,
                        )
                        .join("، ");

                    const contact =
                      partner.email ||
                      partner.phone ||
                      "غير متاح";

                    return (
                      <tr key={partner.id}>
                        <td>
                          <div
                            className={
                              styles.identity
                            }
                          >
                            <span
                              aria-hidden="true"
                              className={
                                styles.initial
                              }
                            >
                              {partner.nameAr
                                .slice(0, 1)}
                            </span>

                            <div>
                              <Link
                                href={`/platform/partners/${partner.id}`}
                              >
                                {
                                  partner.nameAr
                                }
                              </Link>

                              <small>
                                {partner.commercialRegister ||
                                  partner.nameEn ||
                                  "لا يوجد سجل تجاري"}
                              </small>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span
                            className={
                              styles.roles
                            }
                          >
                            {roles ||
                              "غير مصنف"}
                          </span>
                        </td>

                        <td>
                          {partner.city ||
                            "—"}
                        </td>

                        <td>
                          <span
                            className={
                              styles.contact
                            }
                          >
                            {contact}
                          </span>
                        </td>

                        <td>
                          <span
                            className={
                              styles.status
                            }
                            data-status={
                              partner.verificationStatus
                            }
                          >
                            {verificationLabels[
                              partner
                                .verificationStatus
                            ] ??
                              partner
                                .verificationStatus}
                          </span>
                        </td>

                        <td>
                          <span
                            className={
                              styles.invitationCount
                            }
                          >
                            {
                              partner.invitationCount
                            }
                          </span>
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        </FormSection>
      )}
    </main>
  );
}
