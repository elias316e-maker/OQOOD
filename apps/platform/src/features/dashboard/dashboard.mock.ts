import type { DashboardData } from "./dashboard.types";

export const dashboardData: DashboardData = {
  hero: {
    userName: "علي",
    greeting: "صباح الخير",
    dateLabel: "الثلاثاء، 14 يوليو 2026",
    headline: "مركز قيادتك لأعمال اليوم",
    description:
      "لديك 12 مهمة تحتاج إلى المتابعة، منها 3 إجراءات ذات أولوية عالية.",
    alerts: [
      {
        id: "approvals",
        label: "اعتمادات معلقة",
        value: 3,
        description: "تحتاج إلى قرارك",
        tone: "danger",
        icon: "✓",
      },
      {
        id: "closing",
        label: "منافسات تغلق قريبًا",
        value: 2,
        description: "خلال 24 ساعة",
        tone: "warning",
        icon: "◷",
      },
      {
        id: "contracts",
        label: "عقود للمراجعة",
        value: 4,
        description: "بانتظار الإجراء",
        tone: "info",
        icon: "▤",
      },
      {
        id: "suppliers",
        label: "شركاء جدد",
        value: 3,
        description: "مكتملو التسجيل",
        tone: "success",
        icon: "◎",
      },
    ],
    progress: {
      percentage: 68,
      completed: 12,
      total: 18,
      label: "تقدم أعمال اليوم",
    },
  },
};
