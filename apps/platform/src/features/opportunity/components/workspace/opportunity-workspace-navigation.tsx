"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type OpportunityWorkspaceSection =
  | "overview"
  | "boq"
  | "partners"
  | "offers"
  | "criteria"
  | "attachments"
  | "inquiries"
  | "evaluation"
  | "award"
  | "activity";

type OpportunityWorkspaceNavigationProps = {
  opportunityId: string;
};

const navigationItems: ReadonlyArray<{
  key: OpportunityWorkspaceSection;
  label: string;
  icon: string;
  path: (opportunityId: string) => string;
}> = [
  {
    key: "overview",
    label: "نظرة عامة",
    icon: "⌂",
    path: (id) => `/platform/opportunities/${id}`,
  },
  {
    key: "boq",
    label: "جدول الكميات",
    icon: "▤",
    path: (id) => `/platform/opportunities/${id}/boq`,
  },
  {
    key: "partners",
    label: "الموردون",
    icon: "♧",
    path: (id) => `/platform/opportunities/${id}/partners`,
  },
  {
    key: "offers",
    label: "العروض",
    icon: "▧",
    path: (id) => `/platform/opportunities/${id}/offers`,
  },
  {
    key: "criteria",
    label: "معايير القبول",
    icon: "✓",
    path: (id) => `/platform/opportunities/${id}/criteria`,
  },
  {
    key: "attachments",
    label: "المرفقات",
    icon: "▱",
    path: (id) => `/platform/opportunities/${id}/attachments`,
  },
  {
    key: "inquiries",
    label: "الاستفسارات",
    icon: "◌",
    path: (id) => `/platform/opportunities/${id}/inquiries`,
  },
  {
    key: "evaluation",
    label: "التقييم",
    icon: "◫",
    path: (id) => `/platform/opportunities/${id}/evaluation`,
  },
  {
    key: "award",
    label: "الترسية",
    icon: "♜",
    path: (id) => `/platform/opportunities/${id}/award`,
  },
  {
    key: "activity",
    label: "النشاط",
    icon: "◷",
    path: (id) => `/platform/opportunities/${id}/activity`,
  },
];

export function OpportunityWorkspaceNavigation({
  opportunityId,
}: OpportunityWorkspaceNavigationProps) {
  const pathname = usePathname();
  const overviewPath = `/platform/opportunities/${opportunityId}`;

  return (
    <nav
      className="opportunityWorkspaceNavigation"
      aria-label="أقسام مساحة المنافسة"
    >
      {navigationItems.map((item) => {
        const href = item.path(opportunityId);

        const active =
          item.key === "overview"
            ? pathname === overviewPath
            : pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            className={
              active
                ? "opportunityWorkspaceNavigation__item is-active"
                : "opportunityWorkspaceNavigation__item"
            }
            href={href}
            aria-current={active ? "page" : undefined}
            key={item.key}
          >
            <span aria-hidden="true">{item.icon}</span>
            <strong>{item.label}</strong>
          </Link>
        );
      })}
    </nav>
  );
}
