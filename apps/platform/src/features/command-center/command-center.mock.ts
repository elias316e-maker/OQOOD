import type { CommandCenterData } from "./command-center.types";

export const commandCenterData: CommandCenterData = {
  user: {
    firstName: "علي",
    role: "مدير المشتريات",
  },

  date: "الثلاثاء، 14 يوليو 2026",

  hero: {
    eyebrow: "مركز القيادة الذكي",
    title: "صباح الخير، علي",
    description:
      "إليك نظرة سريعة على أعمال اليوم. لديك 12 مهمة تحتاج إلى المتابعة، منها 3 إجراءات ذات أولوية عالية.",

    progress: {
      percentage: 68,
      completed: 12,
      total: 18,
    },

    alerts: [
      {
        id: "approvals",
        title: "اعتمادات معلقة",
        value: 3,
        description: "تحتاج إلى قرارك",
        tone: "red",
        icon: "✓",
      },
      {
        id: "closing",
        title: "منافسات تغلق اليوم",
        value: 2,
        description: "خلال 24 ساعة",
        tone: "orange",
        icon: "⌛",
      },
      {
        id: "contracts",
        title: "عقود للمراجعة",
        value: 4,
        description: "بانتظار الإجراء",
        tone: "blue",
        icon: "▤",
      },
      {
        id: "suppliers",
        title: "موردون جدد",
        value: 3,
        description: "مكتملو التسجيل",
        tone: "green",
        icon: "◎",
      },
    ],
  },

  kpis: [
    {
      id: "contract-value",
      title: "قيمة العقود النشطة",
      value: "18.4M",
      unit: "ريال سعودي",
      change: "15%",
      trend: "up",
      tone: "blue",
      icon: "◇",
      chart: [18, 22, 20, 28, 25, 34, 31, 43],
    },
    {
      id: "win-rate",
      title: "نسبة الفوز",
      value: "32%",
      change: "0.5%",
      trend: "up",
      tone: "purple",
      icon: "◉",
      chart: [25, 27, 26, 30, 29, 33, 31, 36],
    },
    {
      id: "active-contracts",
      title: "عدد العقود النشطة",
      value: "24",
      change: "2%",
      trend: "down",
      tone: "purple",
      icon: "▤",
      chart: [12, 14, 13, 18, 17, 22, 20, 24],
    },
    {
      id: "suppliers",
      title: "الموردون المعتمدون",
      value: "156",
      change: "4.5%",
      trend: "up",
      tone: "green",
      icon: "◎",
      chart: [90, 105, 98, 119, 112, 134, 128, 156],
    },
    {
      id: "monthly-procurement",
      title: "مشتريات هذا الشهر",
      value: "7.8M",
      unit: "ريال سعودي",
      change: "9%",
      trend: "up",
      tone: "cyan",
      icon: "↗",
      chart: [3, 4, 3.8, 5.2, 4.9, 6.4, 6.1, 7.8],
    },
    {
      id: "projects",
      title: "المشاريع النشطة",
      value: "18",
      change: "3",
      trend: "up",
      tone: "purple",
      icon: "◇",
      chart: [8, 10, 9, 12, 11, 14, 13, 18],
    },
  ],

  intelligence: {
    winProbability: 92,
    change: "18%",
    insights: [
      {
        id: "opportunity-match",
        title: "فرصة مناسبة لنشاط الشركة",
        description:
          "توجد 3 منافسات جديدة تتوافق مع تصنيف الشركة وخبراتها السابقة.",
        actionLabel: "عرض الفرص",
        tone: "blue",
        icon: "◇",
      },
      {
        id: "contract-review",
        title: "عقد يحتاج إلى مراجعة",
        description:
          "عقد مشروع مجمع الملك عبدالله يحتوي على بند يحتاج إلى الانتباه.",
        actionLabel: "مراجعة العقد",
        tone: "green",
        icon: "▤",
      },
      {
        id: "possible-delay",
        title: "احتمال تأخر مشروع",
        description:
          "يتوقع النظام تأخرًا محتملًا في مشروعين بناءً على تقدم الأعمال.",
        actionLabel: "عرض التفاصيل",
        tone: "purple",
        icon: "◷",
      },
    ],
  },

  quickActions: {
    actions: [
      {
        id: "new-rfq",
        title: "إنشاء منافسة",
        description: "ابدأ طلب عرض سعر جديد",
        href: "/platform/opportunities/new",
        tone: "blue",
        icon: "＋",
      },
      {
        id: "new-contract",
        title: "إنشاء عقد",
        description: "إضافة عقد جديد",
        href: "/platform/contracts/new",
        tone: "green",
        icon: "▤",
      },
      {
        id: "new-supplier",
        title: "إضافة مورد",
        description: "تسجيل شريك أعمال",
        href: "/platform/partners/new",
        tone: "purple",
        icon: "◎",
      },
      {
        id: "new-project",
        title: "إنشاء مشروع",
        description: "فتح مشروع جديد",
        href: "/platform/projects/new",
        tone: "orange",
        icon: "◇",
      },
      {
        id: "upload-document",
        title: "رفع مستند",
        description: "إضافة ملف إلى المركز",
        href: "/platform/documents",
        tone: "cyan",
        icon: "⇧",
      },
      {
        id: "new-approval",
        title: "طلب موافقة",
        description: "إرسال طلب اعتماد",
        href: "/platform/approvals/new",
        tone: "green",
        icon: "✓",
      },
    ],
  },
};
