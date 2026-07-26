import Link from "next/link";

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
    return <main className={styles.page}><section className={styles.empty}>لا تملك صلاحية الاطلاع على التقارير.</section></main>;
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
  // eslint-disable-next-line react-hooks/purity
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

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div><span>ذكاء الأعمال التشغيلي</span><h1>التقارير والتحليلات</h1><p>صورة موحّدة للأداء المالي والتشغيلي عبر دورة الشراء والتعاقد.</p></div>
        <div className={styles.updated}>محدّث الآن</div>
      </header>

      <section className={styles.kpis}>
        {canReadProcurement && <article><span>القيمة التقديرية للمشتريات</span><strong>{money(estimatedProcurement)}</strong><small>{procurement.length} طلب مشتريات</small></article>}
        {canReadOpportunities && <article><span>المنافسات النشطة</span><strong>{opportunities.filter((item) => item.status === "PUBLISHED").length}</strong><small>{closingSoon} تغلق خلال 7 أيام</small></article>}
        {canReadContracts && <article><span>قيمة العقود</span><strong>{money(contractValue)}</strong><small>{contracts.length} عقد</small></article>}
        {canReadContracts && <article data-tone={overdueMilestones ? "danger" : "normal"}><span>التنفيذ</span><strong>{progress}%</strong><small>{overdueMilestones} مرحلة متأخرة</small></article>}
        {canReadVendors && <article><span>الموردون الموثقون</span><strong>{verifiedPartners} / {partners.length}</strong><small>متوسط الثقة {averageTrust.toFixed(0)}%</small></article>}
      </section>

      <section className={styles.grid}>
        {canReadProcurement && <article className={styles.panel}>
          <div className={styles.panelHead}><div><span>مسار الطلبات</span><h2>حالات المشتريات</h2></div><Link href="/platform/procurement">فتح المشتريات</Link></div>
          <Distribution rows={procurementDistribution} labels={procurementLabels} total={procurement.length} />
        </article>}
        {canReadOpportunities && <article className={styles.panel}>
          <div className={styles.panelHead}><div><span>خط المنافسات</span><h2>حالات المنافسات</h2></div><Link href="/platform/opportunities">فتح المنافسات</Link></div>
          <Distribution rows={opportunityDistribution} labels={opportunityLabels} total={opportunities.length} />
        </article>}
      </section>

      {canReadContracts && <section className={styles.finance}>
        <div><span>المدفوع</span><strong>{money(paid)}</strong><i><b style={{ width: `${contractValue ? Math.min(100, paid / contractValue * 100) : 0}%` }} /></i></div>
        <div><span>مطالبات قيد السداد</span><strong>{money(claimed)}</strong><i><b style={{ width: `${contractValue ? Math.min(100, claimed / contractValue * 100) : 0}%` }} /></i></div>
        <div><span>المتبقي من قيمة العقود</span><strong>{money(Math.max(0, contractValue - paid))}</strong><i><b style={{ width: `${contractValue ? Math.min(100, (contractValue - paid) / contractValue * 100) : 0}%` }} /></i></div>
      </section>}

      {canReadContracts && canReadVendors && <section className={styles.panel}>
        <div className={styles.panelHead}><div><span>تحليل الإنفاق</span><h2>أعلى الموردين حسب قيمة العقود</h2></div><Link href="/platform/partners">دليل الموردين</Link></div>
        {topPartners.length ? <div className={styles.tableWrap}><table><thead><tr><th>المورد</th><th>عدد العقود</th><th>قيمة الأعمال</th><th>الحصة من العقود</th></tr></thead><tbody>
          {topPartners.map((partner) => <tr key={partner.id}><td><Link href={`/platform/partners/${partner.id}`}>{partner.name}</Link></td><td>{partner.contracts}</td><td>{money(partner.value)}</td><td><div className={styles.share}><i><b style={{ width: `${contractValue ? partner.value / contractValue * 100 : 0}%` }} /></i><span>{contractValue ? (partner.value / contractValue * 100).toFixed(1) : "0"}%</span></div></td></tr>)}
        </tbody></table></div> : <p className={styles.empty}>لا توجد عقود كافية لإظهار تحليل الموردين.</p>}
      </section>}
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
  if (!rows.length) return <p className={styles.empty}>لا توجد بيانات متاحة بعد.</p>;
  return <div className={styles.distribution}>{rows.map(([status, count]) => {
    const percentage = total ? count / total * 100 : 0;
    return <div key={status}><div><span>{labels[status] ?? status}</span><strong>{count}</strong></div><i><b style={{ width: `${percentage}%` }} /></i></div>;
  })}</div>;
}
