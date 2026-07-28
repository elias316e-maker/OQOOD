import Link from "next/link";

import { hasPermission, Permissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

import styles from "../contracts.module.css";

export default async function ContractAlertsPage() {
  const context = await requireCurrentWorkspace();
  if (!hasPermission(context, Permissions.contracts.read)) {
    return <main className={styles.page}><p className={styles.empty}>لا تملك صلاحية عرض تنبيهات العقود.</p></main>;
  }
  // Request time is intentionally used to classify operational alerts.
  // eslint-disable-next-line react-hooks/purity
  const now = new Date();
  const warningDate = new Date(now.getTime() + 30 * 86_400_000);
  const contracts = await prisma.contract.findMany({
    where: { workspaceId: context.workspace.id },
    include: { milestones: true, amendments: true },
    orderBy: { updatedAt: "desc" },
  });

  const alerts = contracts.flatMap((contract) => {
    const rows: Array<{ tone: "danger" | "warning"; title: string; detail: string }> = [];
    if (contract.status === "PENDING_APPROVAL") {
      rows.push({ tone: "warning", title: "عقد ينتظر الاعتماد", detail: contract.title });
    }
    if (contract.endDate && contract.endDate <= warningDate) {
      rows.push({
        tone: contract.endDate < now ? "danger" : "warning",
        title: contract.endDate < now ? "عقد متجاوز لتاريخ الانتهاء" : "عقد قريب من الانتهاء",
        detail: `${contract.title} — ${new Intl.DateTimeFormat("ar-SA").format(contract.endDate)}`,
      });
    }
    contract.milestones.forEach((milestone) => {
      if (milestone.dueDate && milestone.dueDate < now && milestone.status !== "ACCEPTED") {
        rows.push({ tone: "danger", title: "مرحلة تنفيذ متأخرة", detail: `${contract.title}: ${milestone.title}` });
      }
      if (milestone.paymentStatus === "CLAIMED") {
        rows.push({ tone: "warning", title: "مطالبة مالية غير مسددة", detail: `${contract.title}: ${milestone.title}` });
      }
    });
    contract.amendments
      .filter((amendment) => amendment.status === "PENDING_APPROVAL")
      .forEach((amendment) => {
        rows.push({ tone: "warning", title: "ملحق ينتظر الاعتماد", detail: `${contract.title}: ملحق رقم ${amendment.number}` });
      });
    return rows.map((row, index) => ({ ...row, id: `${contract.id}-${index}`, contractId: contract.id }));
  });
  const dangerCount = alerts.filter((alert) => alert.tone === "danger").length;
  const warningCount = alerts.length - dangerCount;
  const affectedContracts = new Set(alerts.map((alert) => alert.contractId)).size;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div><span>المتابعة الاستباقية</span><h1>مركز تنبيهات العقود</h1><p>المواعيد والمهام التي تتطلب تدخلاً.</p></div>
        <Link className={styles.back} href="/platform/contracts">العودة إلى العقود</Link>
      </header>
      <section className={styles.alertSummary}>
        <article data-tone={dangerCount ? "danger" : "normal"}><span>عاجلة</span><strong>{dangerCount}</strong><small>تحتاج تدخلاً مباشرًا</small></article>
        <article><span>تحذيرات</span><strong>{warningCount}</strong><small>تحتاج متابعة</small></article>
        <article><span>عقود متأثرة</span><strong>{affectedContracts}</strong><small>من أصل {contracts.length} عقد</small></article>
      </section>
      <section className={styles.alertList}>
        {alerts.length === 0 ? <p className={styles.empty}>لا توجد تنبيهات حالياً.</p> : alerts.map((alert) => (
          <Link data-tone={alert.tone} href={`/platform/contracts/${alert.contractId}`} key={alert.id}>
            <strong>{alert.title}</strong><span>{alert.detail}</span>
          </Link>
        ))}
      </section>
    </main>
  );
}
