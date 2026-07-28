import Link from "next/link";

import { hasPermission, Permissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

import styles from "./calendar.module.css";

type Event = {
  id: string;
  date: Date;
  kind: "opportunity" | "procurement" | "contract" | "milestone";
  title: string;
  detail: string;
  href: string;
};

const kindLabels: Record<Event["kind"], string> = {
  opportunity: "إغلاق منافسة",
  procurement: "احتياج مشتريات",
  contract: "انتهاء عقد",
  milestone: "استحقاق مرحلة",
};

export default async function CalendarPage() {
  const context = await requireCurrentWorkspace();
  const workspaceId = context.workspace.id;
  const canReadProcurement = hasPermission(context, Permissions.procurement.read);
  const canReadOpportunities = hasPermission(context, Permissions.opportunities.read);
  const canReadContracts = hasPermission(context, Permissions.contracts.read);

  const [procurement, opportunities, contracts, milestones] = await Promise.all([
    canReadProcurement ? prisma.procurementRequest.findMany({
      where: { workspaceId, requiredByDate: { not: null }, status: { notIn: ["CANCELLED", "ARCHIVED", "REJECTED"] } },
      select: { id: true, number: true, title: true, requiredByDate: true },
    }) : Promise.resolve([]),
    canReadOpportunities ? prisma.opportunity.findMany({
      where: { workspaceId, closingDate: { not: null }, status: { notIn: ["CANCELLED", "CLOSED", "ARCHIVED"] } },
      select: { id: true, number: true, title: true, closingDate: true },
    }) : Promise.resolve([]),
    canReadContracts ? prisma.contract.findMany({
      where: { workspaceId, endDate: { not: null }, status: { in: ["ACTIVE", "SUSPENDED"] } },
      select: { id: true, number: true, title: true, endDate: true },
    }) : Promise.resolve([]),
    canReadContracts ? prisma.contractMilestone.findMany({
      where: { contract: { workspaceId }, dueDate: { not: null }, status: { not: "ACCEPTED" } },
      select: { id: true, title: true, dueDate: true, contract: { select: { id: true, number: true } } },
    }) : Promise.resolve([]),
  ]);

  const events: Event[] = [
    ...procurement.map((item) => ({ id: item.id, date: item.requiredByDate!, kind: "procurement" as const, title: item.title, detail: item.number, href: `/platform/procurement/${item.id}` })),
    ...opportunities.map((item) => ({ id: item.id, date: item.closingDate!, kind: "opportunity" as const, title: item.title, detail: item.number, href: `/platform/opportunities/${item.id}` })),
    ...contracts.map((item) => ({ id: item.id, date: item.endDate!, kind: "contract" as const, title: item.title, detail: item.number, href: `/platform/contracts/${item.id}` })),
    ...milestones.map((item) => ({ id: item.id, date: item.dueDate!, kind: "milestone" as const, title: item.title, detail: item.contract.number, href: `/platform/contracts/${item.contract.id}#execution` })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  // Request time is used to classify live operational deadlines.
  // eslint-disable-next-line react-hooks/purity
  const now = new Date();
  const weekEnd = new Date(now.getTime() + 7 * 86_400_000);
  const monthEnd = new Date(now.getTime() + 30 * 86_400_000);
  const overdue = events.filter((event) => event.date < now);
  const thisWeek = events.filter((event) => event.date >= now && event.date <= weekEnd);
  const thisMonth = events.filter((event) => event.date > weekEnd && event.date <= monthEnd);
  const later = events.filter((event) => event.date > monthEnd);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div><span>المواعيد التشغيلية</span><h1>التقويم والمهام</h1><p>مواعيد المنافسات والمشتريات والعقود والتسليمات في مكان واحد.</p></div>
        <Link href="/platform/contracts/alerts">مركز التنبيهات</Link>
      </header>
      <section className={styles.summary}>
        <article data-tone={overdue.length ? "danger" : "normal"}><span>متأخرة</span><strong>{overdue.length}</strong><small>تحتاج إجراءً فوريًا</small></article>
        <article><span>خلال 7 أيام</span><strong>{thisWeek.length}</strong><small>مهام هذا الأسبوع</small></article>
        <article><span>خلال 30 يومًا</span><strong>{thisMonth.length}</strong><small>بعد الأسبوع الحالي</small></article>
        <article><span>لاحقًا</span><strong>{later.length}</strong><small>مواعيد مستقبلية</small></article>
      </section>
      <div className={styles.columns}>
        <EventGroup title="متأخرة" tone="danger" events={overdue} />
        <EventGroup title="هذا الأسبوع" tone="current" events={thisWeek} />
        <EventGroup title="هذا الشهر" tone="normal" events={thisMonth} />
        <EventGroup title="لاحقًا" tone="normal" events={later} />
      </div>
    </main>
  );
}

function EventGroup({ title, tone, events }: { title: string; tone: string; events: Event[] }) {
  return <section className={styles.group} data-tone={tone}>
    <header><h2>{title}</h2><span>{events.length}</span></header>
    <div>{events.length === 0 ? <p className={styles.empty}>لا توجد مواعيد.</p> : events.map((event) => (
      <Link href={event.href} key={`${event.kind}-${event.id}`}>
        <time dateTime={event.date.toISOString()}><strong>{new Intl.DateTimeFormat("ar-SA", { day: "numeric" }).format(event.date)}</strong><span>{new Intl.DateTimeFormat("ar-SA", { month: "short" }).format(event.date)}</span></time>
        <div><small>{kindLabels[event.kind]}</small><strong>{event.title}</strong><span>{event.detail}</span></div>
      </Link>
    ))}</div>
  </section>;
}
