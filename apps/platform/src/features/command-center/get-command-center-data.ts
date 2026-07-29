import "server-only";

import { getOperationalNotifications } from "@/features/notifications/operational-notifications";
import { hasPermission, Permissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

import type {
  CommandCenterData,
  CommandEvent,
  CommandOpportunity,
  CommandOpportunityStatus,
} from "./command-center.types";

const day = 86_400_000;

function compactMoney(value: number) {
  return new Intl.NumberFormat("ar-SA", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function relativeDate(date: Date | null, now: Date) {
  if (!date) return "بدون موعد";
  const days = Math.ceil((date.getTime() - now.getTime()) / day);
  if (days < 0) return `متأخر ${Math.abs(days)} يوم`;
  if (days === 0) return "اليوم";
  if (days === 1) return "غداً";
  return `خلال ${days} أيام`;
}

function opportunityStatus(status: string): CommandOpportunityStatus {
  if (status === "DRAFT") return "draft";
  if (["TECHNICAL_EVALUATION", "FINANCIAL_EVALUATION", "NEGOTIATION"].includes(status)) {
    return "evaluation";
  }
  if (["SUBMISSION_CLOSED", "AWARD_PENDING"].includes(status)) return "closing";
  return "published";
}

export async function getCommandCenterData(): Promise<CommandCenterData> {
  const [context, user] = await Promise.all([
    requireCurrentWorkspace(),
    getCurrentUser(),
  ]);
  const workspaceId = context.workspace.id;
  const canReadProcurement = hasPermission(context, Permissions.procurement.read);
  const canReadOpportunities = hasPermission(context, Permissions.opportunities.read);
  const canReadContracts = hasPermission(context, Permissions.contracts.read);
  const canReadVendors = hasPermission(context, Permissions.vendors.read);
  // Request time drives deadline, greeting, and rolling-period indicators.
  // eslint-disable-next-line react-hooks/purity
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDays = new Date(now.getTime() + 30 * day);

  const [procurement, opportunities, contracts, partners, projects, audits, notifications] =
    await Promise.all([
      canReadProcurement
        ? prisma.procurementRequest.findMany({
            where: { workspaceId, status: { not: "ARCHIVED" } },
            orderBy: { updatedAt: "desc" },
            select: {
              id: true, number: true, title: true, status: true, priority: true,
              estimatedTotal: true, requiredByDate: true, createdAt: true, updatedAt: true,
            },
          })
        : Promise.resolve([]),
      canReadOpportunities
        ? prisma.opportunity.findMany({
            where: { workspaceId, status: { notIn: ["ARCHIVED", "CANCELLED"] } },
            orderBy: { updatedAt: "desc" },
            select: {
              id: true, number: true, title: true, status: true, budget: true,
              closingDate: true, createdAt: true, updatedAt: true,
              project: { select: { nameAr: true } },
            },
          })
        : Promise.resolve([]),
      canReadContracts
        ? prisma.contract.findMany({
            where: { workspaceId, status: { not: "ARCHIVED" } },
            orderBy: { updatedAt: "desc" },
            select: {
              id: true, number: true, title: true, status: true, totalAmount: true,
              endDate: true, createdAt: true, updatedAt: true,
              businessPartner: { select: { nameAr: true } },
              milestones: { select: { progress: true, dueDate: true, status: true } },
            },
          })
        : Promise.resolve([]),
      canReadVendors
        ? prisma.businessPartner.findMany({
            where: { workspaceId },
            orderBy: { updatedAt: "desc" },
            select: { id: true, verificationStatus: true, createdAt: true },
          })
        : Promise.resolve([]),
      prisma.project.findMany({
        where: { workspaceId },
        select: { status: true, budget: true, createdAt: true },
      }),
      prisma.auditLog.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true, action: true, entityType: true, createdAt: true,
          user: { select: { name: true } },
        },
      }),
      user ? getOperationalNotifications(context, user.id) : Promise.resolve([]),
    ]);

  const activeContracts = contracts.filter((item) => item.status === "ACTIVE");
  const activeContractValue = activeContracts.reduce(
    (sum, item) => sum + Number(item.totalAmount),
    0,
  );
  const approvedPartners = partners.filter(
    (item) => item.verificationStatus === "VERIFIED",
  ).length;
  const monthlyProcurement = procurement
    .filter((item) => item.createdAt >= monthStart)
    .reduce((sum, item) => sum + Number(item.estimatedTotal ?? 0), 0);
  const activeProjects = projects.filter((item) => item.status === "ACTIVE").length;
  const pendingApprovals =
    procurement.filter((item) => ["SUBMITTED", "UNDER_REVIEW"].includes(item.status)).length +
    opportunities.filter((item) => ["PENDING_APPROVAL", "AWARD_PENDING"].includes(item.status)).length +
    contracts.filter((item) => item.status === "PENDING_APPROVAL").length;
  const closingToday = opportunities.filter(
    (item) => item.closingDate &&
      item.closingDate >= now &&
      item.closingDate.getTime() - now.getTime() <= day,
  ).length;
  const expiringContracts = contracts.filter(
    (item) => item.endDate && item.endDate >= now && item.endDate <= thirtyDays,
  );
  const urgentProcurement = procurement.filter(
    (item) => item.priority === "URGENT" || item.priority === "HIGH",
  );
  const completedWork =
    procurement.filter((item) => item.status === "APPROVED").length +
    opportunities.filter((item) => item.status === "AWARDED").length +
    contracts.filter((item) => ["ACTIVE", "COMPLETED"].includes(item.status)).length;
  const totalWork = procurement.length + opportunities.length + contracts.length;
  const progress = totalWork ? Math.round((completedWork / totalWork) * 100) : 0;

  const displayOpportunities: CommandOpportunity[] = opportunities.slice(0, 4).map((item) => ({
    id: item.id,
    reference: item.number,
    title: item.title,
    organization: item.project?.nameAr ?? context.workspace.nameAr,
    closingLabel: relativeDate(item.closingDate, now),
    progress: item.closingDate
      ? Math.max(5, Math.min(95, 100 - Math.ceil((item.closingDate.getTime() - now.getTime()) / day) * 4))
      : 20,
    status: opportunityStatus(item.status),
    value: item.budget ? `${compactMoney(Number(item.budget))} ${context.workspace.defaultCurrency}` : "غير محدد",
  }));
  const events: CommandEvent[] = [
    ...opportunities.filter((item) => item.closingDate && item.closingDate >= now).slice(0, 3).map((item) => ({
      id: `opportunity-${item.id}`,
      day: new Intl.DateTimeFormat("ar-SA", { day: "numeric" }).format(item.closingDate!),
      month: new Intl.DateTimeFormat("ar-SA", { month: "long" }).format(item.closingDate!),
      title: `إغلاق ${item.title}`,
      description: item.number,
      time: new Intl.DateTimeFormat("ar-SA", { hour: "numeric", minute: "2-digit" }).format(item.closingDate!),
      tone: "red" as const,
    })),
    ...expiringContracts.slice(0, 2).map((item) => ({
      id: `contract-${item.id}`,
      day: new Intl.DateTimeFormat("ar-SA", { day: "numeric" }).format(item.endDate!),
      month: new Intl.DateTimeFormat("ar-SA", { month: "long" }).format(item.endDate!),
      title: `انتهاء ${item.title}`,
      description: item.number,
      time: "طوال اليوم",
      tone: "orange" as const,
    })),
  ].slice(0, 4);

  const monthlyPoints = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    const next = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    return {
      label: new Intl.DateTimeFormat("ar-SA", { month: "long" }).format(date),
      contracts: contracts
        .filter((item) => item.createdAt >= date && item.createdAt < next)
        .reduce((sum, item) => sum + Number(item.totalAmount), 0) / 1_000_000,
      procurement: procurement
        .filter((item) => item.createdAt >= date && item.createdAt < next)
        .reduce((sum, item) => sum + Number(item.estimatedTotal ?? 0), 0) / 1_000_000,
    };
  });

  const unreadNotifications = notifications.filter((item) => !item.read);
  const dangerNotifications = unreadNotifications.filter((item) => item.severity === "danger");
  const userName = user?.name?.trim() || "مرحباً";

  return {
    user: { firstName: userName.split(" ")[0], role: context.roles[0]?.role.name ?? "عضو مساحة العمل" },
    date: new Intl.DateTimeFormat("ar-SA", { dateStyle: "full" }).format(now),
    hero: {
      eyebrow: "مركز القيادة التشغيلي",
      title: `مرحباً، ${userName.split(" ")[0]}`,
      description: totalWork
        ? `لديك ${totalWork} سجلاً تشغيلياً، منها ${pendingApprovals} تحتاج إلى قرار و${dangerNotifications.length} تنبيهات حرجة.`
        : "مساحة العمل جاهزة. ابدأ بإضافة طلب شراء أو منافسة أو عقد.",
      progress: { percentage: progress, completed: completedWork, total: totalWork },
      alerts: [
        { id: "approvals", title: "اعتمادات معلقة", value: pendingApprovals, description: "تحتاج إلى قرار", tone: "red", icon: "✓" },
        { id: "closing", title: "منافسات تغلق اليوم", value: closingToday, description: "خلال 24 ساعة", tone: "orange", icon: "⌛" },
        { id: "contracts", title: "عقود قاربت الانتهاء", value: expiringContracts.length, description: "خلال 30 يوماً", tone: "blue", icon: "▤" },
        { id: "suppliers", title: "موردون معتمدون", value: approvedPartners, description: `من أصل ${partners.length}`, tone: "green", icon: "◎" },
      ],
    },
    kpis: [
      { id: "contract-value", title: "قيمة العقود النشطة", value: compactMoney(activeContractValue), unit: context.workspace.defaultCurrency, change: "فعلي", trend: "up", tone: "blue", icon: "◇", chart: monthlyPoints.map((item) => item.contracts) },
      { id: "active-contracts", title: "العقود النشطة", value: String(activeContracts.length), change: "حالي", trend: "up", tone: "purple", icon: "▤", chart: monthlyPoints.map((item) => item.contracts) },
      { id: "suppliers", title: "الموردون المعتمدون", value: String(approvedPartners), change: `${partners.length} مسجل`, trend: "up", tone: "green", icon: "◎", chart: [partners.length, approvedPartners] },
      { id: "monthly-procurement", title: "مشتريات هذا الشهر", value: compactMoney(monthlyProcurement), unit: context.workspace.defaultCurrency, change: `${procurement.filter((item) => item.createdAt >= monthStart).length} طلب`, trend: "up", tone: "cyan", icon: "↗", chart: monthlyPoints.map((item) => item.procurement) },
      { id: "projects", title: "المشاريع النشطة", value: String(activeProjects), change: `${projects.length} إجمالي`, trend: "up", tone: "purple", icon: "◇", chart: [projects.length, activeProjects] },
    ],
    intelligence: {
      winProbability: opportunities.length ? Math.round(opportunities.filter((item) => item.status === "AWARDED").length / opportunities.length * 100) : 0,
      change: `${opportunities.length} منافسة`,
      insights: [
        { id: "decisions", title: "قرارات تحتاج المتابعة", description: `${pendingApprovals} طلباً أو منافسة أو عقداً بانتظار القرار.`, actionLabel: "عرض الموافقات", tone: "blue", icon: "✓" },
        { id: "deadlines", title: "المواعيد القادمة", description: `${closingToday + expiringContracts.length} موعداً مهماً يستحق المتابعة.`, actionLabel: "فتح التقويم", tone: "green", icon: "⌛" },
        { id: "risk", title: "التنبيهات الحرجة", description: dangerNotifications.length ? `${dangerNotifications.length} تنبيهات متأخرة أو حرجة.` : "لا توجد تنبيهات حرجة حالياً.", actionLabel: "عرض الإشعارات", tone: "purple", icon: "!" },
      ],
    },
    quickActions: {
      actions: [
        { id: "new-procurement", title: "طلب شراء", description: "إنشاء طلب مشتريات", href: "/platform/procurement/new", tone: "blue", icon: "+" },
        { id: "new-rfq", title: "إنشاء منافسة", description: "بدء منافسة جديدة", href: "/platform/opportunities/new", tone: "green", icon: "◇" },
        { id: "new-supplier", title: "إضافة مورد", description: "تسجيل شريك أعمال", href: "/platform/partners/new", tone: "purple", icon: "◎" },
        { id: "new-project", title: "إنشاء مشروع", description: "فتح مشروع جديد", href: "/platform/projects/new", tone: "orange", icon: "▤" },
        { id: "documents", title: "المستندات", description: "إدارة الملفات", href: "/platform/documents", tone: "cyan", icon: "⇧" },
        { id: "approvals", title: "الموافقات", description: "متابعة القرارات", href: "/platform/approvals", tone: "green", icon: "✓" },
      ],
    },
    operations: {
      pipeline: [
        { id: "new", title: "طلبات جديدة", value: procurement.filter((item) => item.status === "DRAFT").length, description: "مسودات طلبات الشراء", tone: "blue" },
        { id: "published", title: "منافسات منشورة", value: opportunities.filter((item) => item.status === "PUBLISHED").length, description: "تستقبل عروضاً", tone: "cyan" },
        { id: "technical", title: "تقييم فني", value: opportunities.filter((item) => item.status === "TECHNICAL_EVALUATION").length, description: "قيد المراجعة", tone: "purple" },
        { id: "commercial", title: "تقييم مالي", value: opportunities.filter((item) => item.status === "FINANCIAL_EVALUATION").length, description: "تحليل الأسعار", tone: "orange" },
        { id: "awarded", title: "تمت الترسية", value: opportunities.filter((item) => item.status === "AWARDED").length, description: "إجمالي المنافسات", tone: "green" },
      ],
      tasks: [
        ...urgentProcurement.slice(0, 2).map((item) => ({ id: item.id, title: item.title, context: item.number, dueLabel: relativeDate(item.requiredByDate, now), priority: item.priority === "URGENT" ? "high" as const : "medium" as const, completed: item.status === "APPROVED" })),
        ...unreadNotifications.slice(0, 2).map((item) => ({ id: item.fingerprint, title: item.title, context: item.description, dueLabel: relativeDate(item.dueAt, now), priority: item.severity === "danger" ? "high" as const : "medium" as const, completed: false })),
      ],
      opportunities: displayOpportunities,
      events,
    },
    performance: {
      periodLabel: "آخر 6 أشهر",
      points: monthlyPoints,
      metrics: [
        { id: "active-value", label: "قيمة العقود النشطة", value: compactMoney(activeContractValue), change: context.workspace.defaultCurrency, trend: "up", tone: "blue" },
        { id: "procurement-value", label: "مشتريات الشهر", value: compactMoney(monthlyProcurement), change: context.workspace.defaultCurrency, trend: "up", tone: "green" },
        { id: "completion", label: "اكتمال الأعمال", value: `${progress}%`, change: `${completedWork}/${totalWork}`, trend: "up", tone: "purple" },
      ],
    },
    activity: {
      items: audits.map((item) => ({
        id: item.id,
        title: item.action,
        description: item.entityType,
        time: new Intl.RelativeTimeFormat("ar-SA", { numeric: "auto" }).format(-Math.max(0, Math.round((now.getTime() - item.createdAt.getTime()) / 3_600_000)), "hour"),
        actor: item.user?.name ?? "النظام",
        icon: "✓",
        tone: "blue",
      })),
    },
    summary: {
      headline: "الملخص التنفيذي المباشر",
      description: totalWork ? "جميع القيم أدناه محسوبة مباشرة من بيانات مساحة العمل الحالية." : "لا توجد بيانات تشغيلية كافية بعد.",
      healthScore: Math.max(0, Math.min(100, 100 - dangerNotifications.length * 10 - pendingApprovals * 2)),
      items: [
        { id: "active-value", label: "قيمة العقود النشطة", value: `${compactMoney(activeContractValue)} ${context.workspace.defaultCurrency}`, tone: "blue" },
        { id: "active-projects", label: "المشاريع النشطة", value: String(activeProjects), tone: "green" },
        { id: "expiring-contracts", label: "عقود تنتهي خلال 30 يوماً", value: String(expiringContracts.length), tone: "orange" },
        { id: "pending-decisions", label: "قرارات معلقة", value: String(pendingApprovals), tone: "purple" },
      ],
    },
    notifications: {
      unreadCount: unreadNotifications.length,
      items: notifications.slice(0, 5).map((item) => ({
        id: item.fingerprint,
        title: item.title,
        description: item.description,
        time: relativeDate(item.dueAt, now),
        tone: item.severity === "danger" ? "red" : item.severity === "warning" ? "orange" : "blue",
        icon: item.severity === "danger" ? "!" : "✓",
        unread: !item.read,
      })),
    },
  };
}
