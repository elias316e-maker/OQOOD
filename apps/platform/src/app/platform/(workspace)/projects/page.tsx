import Link from "next/link";

import { hasPermission, Permissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

import styles from "./projects.module.css";

const statusLabels = {
  PLANNED: "مخطط",
  ACTIVE: "نشط",
  ON_HOLD: "متوقف مؤقتًا",
  COMPLETED: "مكتمل",
  CANCELLED: "ملغي",
};

export default async function ProjectsPage() {
  const context = await requireCurrentWorkspace();
  if (!hasPermission(context, Permissions.workspace.read)) {
    return <main className={styles.page}><p className={styles.empty}>لا تملك صلاحية عرض المشاريع.</p></main>;
  }
  const projects = await prisma.project.findMany({
    where: { workspaceId: context.workspace.id },
    include: {
      procurementRequests: { select: { estimatedTotal: true } },
      opportunities: { select: { id: true } },
      contracts: { select: { totalAmount: true, milestones: { select: { progress: true } } } },
    },
    orderBy: { updatedAt: "desc" },
  });
  const canCreate = hasPermission(context, Permissions.workspace.update);
  const totalBudget = projects.reduce((sum, item) => sum + Number(item.budget ?? 0), 0);
  const committed = projects.flatMap((item) => item.contracts).reduce((sum, item) => sum + Number(item.totalAmount), 0);
  const active = projects.filter((item) => item.status === "ACTIVE").length;
  const averageProgress = projects.length ? Math.round(projects.reduce((sum, project) => {
    const milestones = project.contracts.flatMap((contract) => contract.milestones);
    return sum + (milestones.length ? milestones.reduce((value, item) => value + item.progress, 0) / milestones.length : project.status === "COMPLETED" ? 100 : 0);
  }, 0) / projects.length) : 0;
  const money = (value: number) => new Intl.NumberFormat("ar-SA", { style: "currency", currency: context.workspace.defaultCurrency, maximumFractionDigits: 0 }).format(value);

  return <main className={styles.page}>
    <header className={styles.header}><div><span>محفظة الأعمال</span><h1>المشاريع</h1><p>متابعة الميزانيات والمشتريات والمنافسات والعقود والإنجاز من منظور المشروع.</p></div>{canCreate && <Link href="/platform/projects/new">＋ مشروع جديد</Link>}</header>
    <section className={styles.summary}>
      <article><span>إجمالي المشاريع</span><strong>{projects.length}</strong><small>{active} مشروع نشط</small></article>
      <article><span>الميزانيات المعتمدة</span><strong>{money(totalBudget)}</strong><small>إجمالي المحفظة</small></article>
      <article><span>الارتباطات التعاقدية</span><strong>{money(committed)}</strong><small>{totalBudget ? Math.round(committed / totalBudget * 100) : 0}% من الميزانية</small></article>
      <article><span>متوسط الإنجاز</span><strong>{averageProgress}%</strong><small>وفق مراحل العقود</small></article>
    </section>
    <section className={styles.panel}>
      <div className={styles.panelHead}><div><span>سجل المشاريع</span><h2>المحفظة الحالية</h2></div><small>{projects.length} مشروع</small></div>
      {projects.length ? <div className={styles.cards}>{projects.map((project) => {
        const projectCommitted = project.contracts.reduce((sum, item) => sum + Number(item.totalAmount), 0);
        const milestones = project.contracts.flatMap((item) => item.milestones);
        const progress = milestones.length ? Math.round(milestones.reduce((sum, item) => sum + item.progress, 0) / milestones.length) : project.status === "COMPLETED" ? 100 : 0;
        const utilization = Number(project.budget) ? Math.min(100, Math.round(projectCommitted / Number(project.budget) * 100)) : 0;
        return <Link href={`/platform/projects/${project.id}`} key={project.id}>
          <div className={styles.cardHead}><div><span>{project.code}</span><h3>{project.nameAr}</h3></div><b data-status={project.status}>{statusLabels[project.status]}</b></div>
          <div className={styles.metrics}><span>الميزانية<strong>{project.budget ? money(Number(project.budget)) : "غير محددة"}</strong></span><span>المرتبط<strong>{money(projectCommitted)}</strong></span><span>العقود<strong>{project.contracts.length}</strong></span><span>المنافسات<strong>{project.opportunities.length}</strong></span></div>
          <div className={styles.progress}><div><span>الإنجاز {progress}%</span><span>استخدام الميزانية {utilization}%</span></div><i><b style={{ width: `${progress}%` }} /></i></div>
        </Link>;
      })}</div> : <div className={styles.empty}><strong>لا توجد مشاريع بعد</strong><p>أنشئ المشروع الأول لربط الأعمال والميزانية به.</p></div>}
    </section>
  </main>;
}
