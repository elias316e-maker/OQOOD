import Link from "next/link";
import { notFound } from "next/navigation";

import { hasPermission, Permissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

import styles from "./partner-scorecard.module.css";

export default async function PartnerScorecardPage({ params }: { params: Promise<{ partnerId: string }> }) {
  const { partnerId } = await params;
  const context = await requireCurrentWorkspace();
  if (!hasPermission(context, Permissions.vendors.read)) {
    return <main className={styles.page}><p className={styles.empty}>لا تملك صلاحية عرض المورد.</p></main>;
  }
  const partner = await prisma.businessPartner.findFirst({
    where: { id: partnerId, workspaceId: context.workspace.id },
    include: {
      contracts: {
        include: { milestones: true },
        orderBy: { createdAt: "desc" },
      },
      evaluations: {
        include: { contract: { select: { number: true } }, createdBy: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!partner) notFound();
  const evaluations = partner.evaluations;
  const average = (field: "timelinessScore" | "qualityScore" | "responsivenessScore" | "financialScore") =>
    evaluations.length ? evaluations.reduce((sum, item) => sum + item[field], 0) / evaluations.length : 0;
  const totalBusiness = partner.contracts.reduce((sum, contract) => sum + Number(contract.totalAmount), 0);
  const milestones = partner.contracts.flatMap((contract) => contract.milestones);
  const acceptedWithDue = milestones.filter((item) => item.acceptedAt && item.dueDate);
  const onTime = acceptedWithDue.length
    ? Math.round(acceptedWithDue.filter((item) => item.acceptedAt! <= item.dueDate!).length / acceptedWithDue.length * 100)
    : 0;
  // Request time is intentionally used for current operational risk indicators.
  // eslint-disable-next-line react-hooks/purity
  const now = new Date();
  const overdue = milestones.filter((item) => item.dueDate && item.dueDate < now && item.status !== "ACCEPTED").length;
  const unpaid = milestones.filter((item) => item.paymentStatus === "CLAIMED").length;
  const money = new Intl.NumberFormat("ar-SA", { style: "currency", currency: context.workspace.defaultCurrency, maximumFractionDigits: 0 });
  const dimensions = [
    ["الالتزام بالمواعيد", average("timelinessScore")],
    ["جودة التسليم", average("qualityScore")],
    ["الاستجابة", average("responsivenessScore")],
    ["الأداء المالي", average("financialScore")],
  ] as const;

  return <main className={styles.page}>
    <header className={styles.header}><div><span>بطاقة أداء المورد</span><h1>{partner.nameAr}</h1><p>{partner.commercialRegister ?? "دون سجل تجاري"} · {partner.city ?? "المدينة غير محددة"}</p></div><Link className={styles.back} href="/platform/partners">العودة للموردين</Link></header>
    <section className={styles.kpis}>
      <article><span>مؤشر الثقة</span><strong>{partner.trustScore?.toString() ?? "—"} / 100</strong></article>
      <article><span>قيمة الأعمال</span><strong>{money.format(totalBusiness)}</strong></article>
      <article><span>العقود</span><strong>{partner.contracts.length}</strong></article>
      <article><span>الالتزام بالمواعيد</span><strong>{onTime}%</strong></article>
    </section>
    <section className={styles.panel}><h2>متوسط محاور الأداء</h2><div className={styles.scores}>{dimensions.map(([label, value]) => <div className={styles.score} key={label}><span>{label} — {value.toFixed(1)} / 5</span><div><i style={{ width: `${value * 20}%` }} /></div></div>)}</div></section>
    <section className={styles.panel}><h2>المخاطر والتنبيهات</h2><div className={styles.risks}>{overdue > 0 && <div className={styles.risk} data-tone="danger">{overdue} مرحلة تنفيذ متأخرة</div>}{unpaid > 0 && <div className={styles.risk}>{unpaid} مطالبة مالية غير مسددة</div>}{overdue === 0 && unpaid === 0 && <p className={styles.empty}>لا توجد مخاطر تشغيلية حالية.</p>}</div></section>
    <section className={styles.panel}><h2>تاريخ العقود</h2><table className={styles.table}><thead><tr><th>العقد</th><th>الحالة</th><th>القيمة</th><th>المراحل</th></tr></thead><tbody>{partner.contracts.map((contract) => <tr key={contract.id}><td><Link href={`/platform/contracts/${contract.id}`}>{contract.number}</Link></td><td>{contract.status}</td><td>{money.format(Number(contract.totalAmount))}</td><td>{contract.milestones.length}</td></tr>)}</tbody></table></section>
    <section className={styles.panel}><h2>سجل التقييمات</h2><table className={styles.table}><thead><tr><th>العقد</th><th>النتيجة</th><th>المقيّم</th><th>التاريخ</th></tr></thead><tbody>{evaluations.map((evaluation) => <tr key={evaluation.id}><td>{evaluation.contract.number}</td><td>{evaluation.overallScore.toString()} / 5</td><td>{evaluation.createdBy.name}</td><td>{new Intl.DateTimeFormat("ar-SA").format(evaluation.createdAt)}</td></tr>)}</tbody></table></section>
  </main>;
}
