import Link from "next/link";
import { notFound } from "next/navigation";

import { LinkedDocuments } from "@/features/documents/linked-documents";
import { updateProjectStatusAction } from "@/features/projects/actions";
import { hasPermission, Permissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

import listStyles from "../projects.module.css";
import styles from "./project-details.module.css";

const statusLabels = {
  PLANNED: "مخطط",
  ACTIVE: "نشط",
  ON_HOLD: "متوقف مؤقتًا",
  COMPLETED: "مكتمل",
  CANCELLED: "ملغي",
};

export default async function ProjectDetailsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const context = await requireCurrentWorkspace();
  if (!hasPermission(context, Permissions.workspace.read)) {
    return <main className={listStyles.page}><p className={listStyles.empty}>لا تملك صلاحية عرض المشروع.</p></main>;
  }
  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId: context.workspace.id },
    include: {
      procurementRequests: { orderBy: { updatedAt: "desc" }, take: 10 },
      opportunities: { orderBy: { updatedAt: "desc" }, take: 10 },
      contracts: {
        include: { businessPartner: { select: { nameAr: true } }, milestones: true },
        orderBy: { updatedAt: "desc" },
      },
    },
  });
  if (!project) notFound();
  const canManage = hasPermission(context, Permissions.workspace.update);
  const canReadProcurement = hasPermission(context, Permissions.procurement.read);
  const canReadOpportunities = hasPermission(context, Permissions.opportunities.read);
  const canReadContracts = hasPermission(context, Permissions.contracts.read);
  const committed = project.contracts.reduce((sum, item) => sum + Number(item.totalAmount), 0);
  const estimated = project.procurementRequests.reduce((sum, item) => sum + Number(item.estimatedTotal ?? 0), 0);
  const milestones = project.contracts.flatMap((item) => item.milestones);
  const progress = milestones.length ? Math.round(milestones.reduce((sum, item) => sum + item.progress, 0) / milestones.length) : project.status === "COMPLETED" ? 100 : 0;
  const utilization = Number(project.budget) ? Math.round(committed / Number(project.budget) * 100) : 0;
  const money = (value: number) => new Intl.NumberFormat("ar-SA", { style: "currency", currency: project.currency, maximumFractionDigits: 0 }).format(value);
  const date = (value: Date | null) => value ? new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium" }).format(value) : "غير محدد";

  return <main className={listStyles.page}>
    <header className={listStyles.header}><div><span>{project.code}</span><h1>{project.nameAr}</h1><p>{project.description ?? "لا يوجد وصف تفصيلي للمشروع."}</p></div><Link href="/platform/projects">العودة للمشاريع</Link></header>
    <section className={styles.hero}>
      <div><span>حالة المشروع</span><strong>{statusLabels[project.status]}</strong><small>{date(project.startDate)} — {date(project.endDate)}</small></div>
      <div><span>الميزانية</span><strong>{project.budget ? money(Number(project.budget)) : "غير محددة"}</strong><small>المرتبط {money(committed)}</small></div>
      <div><span>نسبة الإنجاز</span><strong>{progress}%</strong><i><b style={{ width: `${progress}%` }} /></i></div>
      <div data-tone={utilization > 100 ? "danger" : "normal"}><span>استخدام الميزانية</span><strong>{utilization}%</strong><small>{money(Math.max(0, Number(project.budget ?? 0) - committed))} متبقٍ</small></div>
    </section>
    {canManage && <section className={styles.statusBar}><div><strong>تحديث حالة المشروع</strong><span>الحالة الحالية: {statusLabels[project.status]}</span></div><div>{Object.entries(statusLabels).filter(([status]) => status !== project.status).map(([status, label]) => <form action={updateProjectStatusAction} key={status}><input name="projectId" type="hidden" value={project.id} /><input name="status" type="hidden" value={status} /><button type="submit">{label}</button></form>)}</div></section>}
    <section className={styles.metrics}>
      <article><span>طلبات المشتريات</span><strong>{project.procurementRequests.length}</strong><small>{money(estimated)} قيمة تقديرية</small></article>
      <article><span>المنافسات</span><strong>{project.opportunities.length}</strong><small>{project.opportunities.filter((item) => item.status === "PUBLISHED").length} منشورة</small></article>
      <article><span>العقود</span><strong>{project.contracts.length}</strong><small>{project.contracts.filter((item) => item.status === "ACTIVE").length} سارية</small></article>
      <article><span>مراحل التنفيذ</span><strong>{milestones.length}</strong><small>{milestones.filter((item) => item.status === "ACCEPTED").length} مقبولة</small></article>
    </section>
    <div className={styles.columns}>
      {canReadProcurement && <section className={styles.panel}><header><h2>طلبات المشتريات</h2><Link href="/platform/procurement">عرض الكل</Link></header>{project.procurementRequests.length ? <div className={styles.rows}>{project.procurementRequests.map((item) => <Link href={`/platform/procurement/${item.id}`} key={item.id}><div><strong>{item.title}</strong><span>{item.number}</span></div><b>{item.status}</b></Link>)}</div> : <p>لا توجد طلبات مرتبطة.</p>}</section>}
      {canReadOpportunities && <section className={styles.panel}><header><h2>المنافسات</h2><Link href="/platform/opportunities">عرض الكل</Link></header>{project.opportunities.length ? <div className={styles.rows}>{project.opportunities.map((item) => <Link href={`/platform/opportunities/${item.id}`} key={item.id}><div><strong>{item.title}</strong><span>{item.number}</span></div><b>{item.status}</b></Link>)}</div> : <p>لا توجد منافسات مرتبطة.</p>}</section>}
    </div>
    {canReadContracts && <section className={styles.panel}><header><h2>العقود والتنفيذ</h2><Link href="/platform/contracts">عرض العقود</Link></header>{project.contracts.length ? <div className={styles.contracts}>{project.contracts.map((contract) => {
      const contractProgress = contract.milestones.length ? Math.round(contract.milestones.reduce((sum, item) => sum + item.progress, 0) / contract.milestones.length) : 0;
      return <Link href={`/platform/contracts/${contract.id}`} key={contract.id}><div><strong>{contract.title}</strong><span>{contract.number} · {contract.businessPartner.nameAr}</span></div><div><b>{money(Number(contract.totalAmount))}</b><i><em style={{ width: `${contractProgress}%` }} /></i><small>{contractProgress}%</small></div></Link>;
    })}</div> : <p>لا توجد عقود مرتبطة.</p>}</section>}
    <LinkedDocuments canManage={canManage} entityId={project.id} entityType="PROJECT" workspaceId={context.workspace.id} />
  </main>;
}
