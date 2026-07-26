import Link from "next/link";

import { PrismaOpportunityAuthorizationGateway } from "@/features/opportunity/authorization";
import { resolveOpportunityActionContext } from "@/features/opportunity/actions";
import { Permissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

import styles from "./contracts.module.css";

export default async function ContractsPage() {
  const context = await resolveOpportunityActionContext();
  const authorization = new PrismaOpportunityAuthorizationGateway();
  const contracts = await prisma.$transaction(async (transaction) => {
    await authorization.authorize(transaction, {
      workspaceId: context.workspaceId,
      actorUserId: context.actorUserId,
      permission: Permissions.contracts.read,
      requireWriteAccess: false,
    });
    return transaction.contract.findMany({
      where: { workspaceId: context.workspaceId },
      include: {
        businessPartner: { select: { nameAr: true } },
        milestones: true,
      },
      orderBy: { createdAt: "desc" },
    });
  });

  // The request time is intentionally captured for operational overdue indicators.
  // eslint-disable-next-line react-hooks/purity
  const now = new Date();
  const milestones = contracts.flatMap((contract) => contract.milestones);
  const totalValue = contracts.reduce((sum, contract) => sum + Number(contract.totalAmount), 0);
  const claimed = milestones.filter((item) => item.paymentStatus === "CLAIMED")
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const paid = milestones.filter((item) => item.paymentStatus === "PAID")
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const overdue = milestones.filter((item) =>
    item.dueDate && item.dueDate < now && item.status !== "ACCEPTED",
  ).length;
  const weightedProgress = milestones.length
    ? Math.round(milestones.reduce((sum, item) => sum + item.progress, 0) / milestones.length)
    : 0;
  const money = (value: number) =>
    new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(value);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div><span>إدارة دورة التعاقد والتنفيذ</span><h1>العقود</h1><p>متابعة العقود والمراحل والتسليمات والموقف المالي.</p></div>
        <Link className={styles.editLink} href="/platform/contracts/alerts">مركز التنبيهات</Link>
      </header>

      <section className={styles.kpis}>
        <article><span>قيمة العقود</span><strong>{money(totalValue)}</strong></article>
        <article><span>متوسط الإنجاز</span><strong>{weightedProgress}%</strong></article>
        <article data-tone={overdue ? "danger" : "normal"}><span>مراحل متأخرة</span><strong>{overdue}</strong></article>
        <article><span>مطالبات قيد السداد</span><strong>{money(claimed)}</strong></article>
        <article><span>المدفوع</span><strong>{money(paid)}</strong></article>
        <article><span>المتبقي من العقود</span><strong>{money(Math.max(0, totalValue - paid))}</strong></article>
      </section>

      <section className={styles.panel}>
        {contracts.length === 0 ? <p className={styles.empty}>لا توجد عقود بعد.</p> : (
          <table className={styles.table}>
            <thead><tr><th>رقم العقد</th><th>العنوان</th><th>المورد</th><th>الحالة</th><th>القيمة</th><th>الإنجاز</th><th>المتأخر</th></tr></thead>
            <tbody>{contracts.map((contract) => {
              const progress = contract.milestones.length
                ? Math.round(contract.milestones.reduce((sum, item) => sum + item.progress, 0) / contract.milestones.length)
                : 0;
              const late = contract.milestones.filter((item) =>
                item.dueDate && item.dueDate < now && item.status !== "ACCEPTED",
              ).length;
              return <tr key={contract.id}>
                <td><Link href={`/platform/contracts/${contract.id}`}>{contract.number}</Link></td>
                <td>{contract.title}</td><td>{contract.businessPartner.nameAr}</td>
                <td><span className={styles.status}>{contract.status}</span></td>
                <td>{new Intl.NumberFormat("ar-SA", { style: "currency", currency: contract.currency }).format(Number(contract.totalAmount))}</td>
                <td><div className={styles.inlineProgress}><i style={{ width: `${progress}%` }} /><span>{progress}%</span></div></td>
                <td><b data-alert={late > 0}>{late}</b></td>
              </tr>;
            })}</tbody>
          </table>
        )}
      </section>
    </main>
  );
}
