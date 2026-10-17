"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge, SidebarNavItem } from "@oqood/design-system";

const navigation = [
  {
    label: "الرئيسية",
    href: "/platform",
    icon: "⌂",
  },
  {
    label: "المنافسات",
    href: "/platform/opportunities",
    icon: "☆",
  },
  {
    label: "المشتريات",
    href: "/platform/procurement",
    icon: "◈",
  },
  {
    label: "العقود",
    href: "/platform/contracts",
    icon: "▣",
    badge: "3",
  },
  {
    label: "المشاريع",
    href: "/platform/projects",
    icon: "♙",
  },
  {
    label: "الموردون",
    href: "/platform/partners",
    icon: "♧",
  },
  {
    label: "الموافقات",
    href: "/platform/approvals",
    icon: "✓",
    badge: "4",
  },
  {
    label: "الإشعارات",
    href: "/platform/notifications",
    icon: "◉",
  },
  {
    label: "التقارير",
    href: "/platform/reports",
    icon: "▥",
  },
  {
    label: "المستندات",
    href: "/platform/documents",
    icon: "□",
  },
  {
    label: "التقويم",
    href: "/platform/calendar",
    icon: "▦",
  },
  {
    label: "الإعدادات",
    href: "/platform/settings",
    icon: "⚙",
  },
];

export function SidebarNavigation({
  opportunityCount,
}: {
  opportunityCount?: string;
}) {
  const pathname = usePathname();

  return (
    <>
      {navigation.map((item) => {
        const active = item.href === "/platform"
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const count = item.href === "/platform/opportunities"
          ? opportunityCount
          : item.badge;

        return (
          <Link
            href={item.href}
            key={item.href}
            aria-current={active ? "page" : undefined}
          >
            <SidebarNavItem
              active={active}
              badge={count ? (
                <Badge size="sm" tone="primary">{count}</Badge>
              ) : undefined}
              icon={<span>{item.icon}</span>}
              label={item.label}
            />
          </Link>
        );
      })}
    </>
  );
}
