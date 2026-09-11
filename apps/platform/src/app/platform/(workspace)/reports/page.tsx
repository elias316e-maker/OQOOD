import Link from "next/link";

import {
  EmptyState,
  FormSection,
  WorkspaceHeader,
} from "@oqood/design-system";

import { hasPermission, Permissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

import styles from "./reports.module.css";

const procurementLabels: Record<string, string> = {
  DRAFT: "مسودة",
  SUBMITTED: "مرسل",
  UNDER_REVIEW: "تحت المراجعة",
  CHANGES_REQUESTED: "تعديلات مطلوبة",
  APPROVED: "معتمد",
  REJECTED: "مرفوض",
  CANCELLED: "ملغي",
  ARCHIVED: "مؤرشف",
};

const opportunityLabels: Record<string, string> = {
  DRAFT: "مسودة",
  PUBLISHED: "منشورة",
  CLOSED: "مغلقة",
  AWARDED: "مرساة",
  CANCELLED: "ملغاة",
};

export default async function ReportsPage() {
  const context = await requireCurrentWorkspace();
  const workspaceId = context.workspace.id;
  const canReadProcurement = hasPermission(context, Permissions.procurement.read);
  const canReadOpportunities = hasPermission(context, Permissions.opportunities.read);
  const canReadContracts = hasPermission(context, Permissions.contracts.read);
  const canReadVendors = hasPermission(context, Permissions.vendors.read);

  if (!canReadProcurement && !canReadOpportunities && !canReadContracts && !canReadVendors) {
    return (
      <main className={styles.page}>
        <EmptyState
          className={styles.routeState}
          tone="warning"
          icon="!"
          title="لا تملك صلاحية الاطلاع على التقارير"
          description="تواصل مع مسؤول مساحة العمل للحصول على صلاحية الوصول إلى التقارير والتحليلات."
          role="alert"
          aria-live="polite"
          actions={
            <Link
              className={styles.backButton}
              href="/platform"
            >
              العودة إلى لوحة التحكم
            </Link>
          }
        />
      </main>
    );
  }

  const [procurement, opportunities, contracts, partners] = await Promise.all([
    canReadProcurement
      ? prisma.procurementRequest.findMany({
          where: { workspaceId },
          select: { status: true, priority: true, estimatedTotal: true },
        })
      : Promise.resolve([]),
    canReadOpportunities
      ? prisma.opportunity.findMany({
          where: { workspaceId },
          select: { status: true, budget: true, closingDate: true },
        })
      : Promise.resolve([]),
    canReadContracts
      ? prisma.contract.findMany({
          where: { workspaceId },
          select: {
            id: true,
            status: true,
            totalAmount: true,
            businessPartnerId: true,
            businessPartner: { select: { nameAr: true } },
            milestones: {
              select: { amount: true, progress: true, status: true, paymentStatus: true, dueDate: true },
            },
          },
        })
      : Promise.resolve([]),
    canReadVendors
      ? prisma.businessPartner.findMany({
          where: { workspaceId },
          select: { id: true, nameAr: true, trustScore: true, verificationStatus: true },
        })
      : Promise.resolve([]),
  ]);

  // Request time is required for live deadline and delay indicators.
  const now = new Date();
  const currency = context.workspace.defaultCurrency;
  const money = (value: number) =>
    new Intl.NumberFormat("ar-SA", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
  const contractValue = contracts.reduce((sum, item) => sum + Number(item.totalAmount), 0);
  const milestones = contracts.flatMap((item) => item.milestones);
  const paid = milestones.filter((item) => item.paymentStatus === "PAID")
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const claimed = milestones.filter((item) => item.paymentStatus === "CLAIMED")
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const overdueMilestones = milestones.filter(
    (item) => item.dueDate && item.dueDate < now && item.status !== "ACCEPTED",
  ).length;
  const progress = milestones.length
    ? Math.round(milestones.reduce((sum, item) => sum + item.progress, 0) / milestones.length)
    : 0;
  const estimatedProcurement = procurement.reduce(
    (sum, item) => sum + Number(item.estimatedTotal ?? 0),
    0,
  );
  const closingSoon = opportunities.filter((item) => {
    if (!item.closingDate || item.closingDate < now) return false;
    return item.closingDate.getTime() - now.getTime() <= 7 * 24 * 60 * 60 * 1000;
  }).length;
  const procurementDistribution = Object.entries(
    procurement.reduce<Record<string, number>>((counts, item) => {
      counts[item.status] = (counts[item.status] ?? 0) + 1;
      return counts;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
  const opportunityDistribution = Object.entries(
    opportunities.reduce<Record<string, number>>((counts, item) => {
      counts[item.status] = (counts[item.status] ?? 0) + 1;
      return counts;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
  const partnerSpend = contracts.reduce<Record<string, { id: string; name: string; value: number; contracts: number }>>(
    (result, contract) => {
      const current = result[contract.businessPartnerId] ?? {
        id: contract.businessPartnerId,
        name: contract.businessPartner.nameAr,
        value: 0,
        contracts: 0,
      };
      current.value += Number(contract.totalAmount);
      current.contracts += 1;
      result[contract.businessPartnerId] = current;
      return result;
    },
    {},
  );
  const topPartners = Object.values(partnerSpend).sort((a, b) => b.value - a.value).slice(0, 5);
  const verifiedPartners = partners.filter((item) => item.verificationStatus === "VERIFIED").length;
  const averageTrust = partners.filter((item) => item.trustScore !== null).length
    ? partners.reduce((sum, item) => sum + Number(item.trustScore ?? 0), 0)
      / partners.filter((item) => item.trustScore !== null).length
    : 0;

  const remainingContractValue =
    Math.max(
      0,
      contractValue - paid,
    );

  const paidPercentage =
    contractValue > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (paid / contractValue) *
              100,
          ),
        )
      : 0;

  const claimedPercentage =
    contractValue > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (claimed / contractValue) *
              100,
          ),
        )
      : 0;

  const remainingPercentage =
    contractValue > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (
              remainingContractValue /
              contractValue
            ) * 100,
          ),
        )
      : 0;

  return (
    <main className={styles.page}>
      <WorkspaceHeader
        className={styles.workspaceHeader}
        eyebrow="ذكاء الأعمال التشغيلي"
        title="التقارير والتحليلات"
        description="صورة موحّدة للأداء المالي والتشغيلي عبر دورة الشراء والتعاقد."
        actions={
          <span
            className={styles.updated}
            role="status"
          >
            محدّث الآن
          </span>
        }
      />

      <section
        aria-label="مؤشرات التقارير الرئيسية"
        className={styles.kpis}
      >
        {canReadProcurement && <article><span>القيمة التقديرية للمشتريات</span><strong>{money(estimatedProcurement)}</strong><small>{procurement.length} طلب مشتريات</small></article>}
        {canReadOpportunities && <article><span>المنافسات النشطة</span><strong>{opportunities.filter((item) => item.status === "PUBLISHED").length}</strong><small>{closingSoon} تغلق خلال 7 أيام</small></article>}
        {canReadContracts && <article><span>قيمة العقود</span><strong>{money(contractValue)}</strong><small>{contracts.length} عقد</small></article>}
        {canReadContracts && <article data-tone={overdueMilestones ? "danger" : "normal"}><span>التنفيذ</span><strong>{progress}%</strong><small>{overdueMilestones} مرحلة متأخرة</small></article>}
        {canReadVendors && <article><span>الموردون الموثقون</span><strong>{verifiedPartners} / {partners.length}</strong><small>متوسط الثقة {averageTrust.toFixed(0)}%</small></article>}
      </section>

      <section
        aria-label="توزيع حالات العمليات"
        className={styles.grid}
      >
        {canReadProcurement ? (
          <FormSection
            className={styles.reportPanel}
            eyebrow="مسار الطلبات"
            title="حالات المشتريات"
            description="توزيع طلبات المشتريات حسب حالتها الحالية."
            actions={
              <Link href="/platform/procurement">
                فتح المشتريات
              </Link>
            }
          >
            <Distribution
              rows={procurementDistribution}
              labels={procurementLabels}
              total={procurement.length}
            />
          </FormSection>
        ) : null}

        {canReadOpportunities ? (
          <FormSection
            className={styles.reportPanel}
            eyebrow="خط المنافسات"
            title="حالات المنافسات"
            description="توزيع المنافسات حسب المرحلة التشغيلية الحالية."
            actions={
              <Link href="/platform/opportunities">
                فتح المنافسات
              </Link>
            }
          >
            <Distribution
              rows={opportunityDistribution}
              labels={opportunityLabels}
              total={opportunities.length}
            />
          </FormSection>
        ) : null}
      </section>

      {canReadContracts ? (
        <FormSection
          className={styles.financePanel}
          eyebrow="الأداء المالي"
          title="التدفقات المالية للعقود"
          description="مقارنة قيمة العقود بالمبالغ المدفوعة والمطالبات والمتبقي."
          actions={
            <Link href="/platform/contracts">
              فتح العقود
            </Link>
          }
        >
          {contractValue > 0 ? (
            <div
              className={styles.finance}
              aria-label="ملخص التدفقات المالية للعقود"
            >
              <article
                className={
                  styles.financeMetric
                }
              >
                <span>المدفوع</span>

                <strong>
                  {money(paid)}
                </strong>

                <div
                  aria-label="نسبة المدفوع من قيمة العقود"
                  aria-valuemax={100}
                  aria-valuemin={0}
                  aria-valuenow={Math.round(
                    paidPercentage,
                  )}
                  className={
                    styles.progressTrack
                  }
                  role="progressbar"
                >
                  <span
                    className={
                      styles.progressFill
                    }
                    style={{
                      width:
                        `${paidPercentage}%`,
                    }}
                  />
                </div>

                <small>
                  {paidPercentage.toFixed(
                    0,
                  )}
                  % من قيمة العقود
                </small>
              </article>

              <article
                className={
                  styles.financeMetric
                }
              >
                <span>
                  مطالبات قيد السداد
                </span>

                <strong>
                  {money(claimed)}
                </strong>

                <div
                  aria-label="نسبة المطالبات من قيمة العقود"
                  aria-valuemax={100}
                  aria-valuemin={0}
                  aria-valuenow={Math.round(
                    claimedPercentage,
                  )}
                  className={
                    styles.progressTrack
                  }
                  role="progressbar"
                >
                  <span
                    className={
                      styles.progressFill
                    }
                    style={{
                      width:
                        `${claimedPercentage}%`,
                    }}
                  />
                </div>

                <small>
                  {claimedPercentage.toFixed(
                    0,
                  )}
                  % من قيمة العقود
                </small>
              </article>

              <article
                className={
                  styles.financeMetric
                }
              >
                <span>
                  المتبقي من قيمة العقود
                </span>

                <strong>
                  {money(
                    remainingContractValue,
                  )}
                </strong>

                <div
                  aria-label="نسبة المتبقي من قيمة العقود"
                  aria-valuemax={100}
                  aria-valuemin={0}
                  aria-valuenow={Math.round(
                    remainingPercentage,
                  )}
                  className={
                    styles.progressTrack
                  }
                  role="progressbar"
                >
                  <span
                    className={
                      styles.progressFill
                    }
                    style={{
                      width:
                        `${remainingPercentage}%`,
                    }}
                  />
                </div>

                <small>
                  {remainingPercentage.toFixed(
                    0,
                  )}
                  % من قيمة العقود
                </small>
              </article>
            </div>
          ) : (
            <EmptyState
              className={
                styles.compactEmpty
              }
              icon="▤"
              title="لا توجد بيانات مالية للعقود"
              description="لا توجد عقود بقيمة مالية تسمح بعرض التدفقات حتى الآن."
              role="status"
            />
          )}
        </FormSection>
      ) : null}

      {canReadContracts &&
      canReadVendors ? (
        <FormSection
          className={styles.reportPanel}
          eyebrow="تحليل الإنفاق"
          title="أعلى الموردين حسب قيمة العقود"
          description="أعلى الموردين من حيث قيمة العقود المرتبطة بمساحة العمل."
          actions={
            <Link href="/platform/partners">
              دليل الموردين
            </Link>
          }
        >
          {topPartners.length > 0 ? (
            <div className={styles.tableWrap}>
              <table>
                <caption
                  className={styles.srOnly}
                >
                  أعلى الموردين حسب قيمة
                  العقود في مساحة العمل
                </caption>
                <thead>
                  <tr>
                    <th>المورد</th>
                    <th>عدد العقود</th>
                    <th>قيمة الأعمال</th>
                    <th>الحصة من العقود</th>
                  </tr>
                </thead>

                <tbody>
                  {topPartners.map(
                    (partner) => {
                      const share =
                        contractValue > 0
                          ? (
                              partner.value /
                              contractValue
                            ) *
                            100
                          : 0;

                      return (
                        <tr key={partner.id}>
                          <td>
                            <Link
                              href={`/platform/partners/${partner.id}`}
                            >
                              {partner.name}
                            </Link>
                          </td>

                          <td>
                            {
                              partner.contracts
                            }
                          </td>

                          <td>
                            {money(
                              partner.value,
                            )}
                          </td>

                          <td>
                            <div
                              className={
                                styles.share
                              }
                            >
                              <i
                                aria-hidden="true"
                              >
                                <b
                                  style={{
                                    width:
                                      `${share}%`,
                                  }}
                                />
                              </i>

                              <span>
                                {share.toFixed(
                                  1,
                                )}
                                %
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              className={
                styles.compactEmpty
              }
              icon="▥"
              title="لا توجد بيانات إنفاق كافية"
              description="لا توجد عقود كافية لإظهار تحليل الموردين حتى الآن."
              role="status"
            />
          )}
        </FormSection>
      ) : null}
    </main>
  );
}

function Distribution({
  rows,
  labels,
  total,
}: {
  rows: [string, number][];
  labels: Record<string, string>;
  total: number;
}) {
  if (!rows.length) {
    return (
      <EmptyState
        className={styles.compactEmpty}
        icon="▤"
        title="لا توجد بيانات متاحة"
        description="لا توجد سجلات كافية لإظهار هذا التوزيع حتى الآن."
        role="status"
      />
    );
  }

  return (
    <div
      className={styles.distribution}
      role="list"
    >
      {rows.map(
        ([status, count]) => {
          const percentage =
            total > 0
              ? Math.min(
                  100,
                  Math.max(
                    0,
                    (count / total) * 100,
                  ),
                )
              : 0;

          const label =
            labels[status] ?? status;

          return (
            <div
              className={
                styles.distributionRow
              }
              key={status}
              role="listitem"
            >
              <div
                className={
                  styles.distributionLabel
                }
              >
                <span>{label}</span>
                <strong>{count}</strong>
              </div>

              <div
                aria-label={`نسبة ${label}`}
                aria-valuemax={100}
                aria-valuemin={0}
                aria-valuenow={Math.round(
                  percentage,
                )}
                className={
                  styles.progressTrack
                }
                role="progressbar"
              >
                <span
                  className={
                    styles.progressFill
                  }
                  style={{
                    width:
                      `${percentage}%`,
                  }}
                />
              </div>

              <small>
                {percentage.toFixed(0)}%
              </small>
            </div>
          );
        },
      )}
    </div>
  );
}
