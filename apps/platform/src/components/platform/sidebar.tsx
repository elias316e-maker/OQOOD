import Link from "next/link";
import {
  Avatar,
  Badge,
  OqoodLogo,
  Sidebar as OqoodSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarNavItem,
} from "@oqood/design-system";

import {
  listWorkspaceOpportunitiesAction,
} from "@/features/opportunity/actions/list-workspace-opportunities";

const navigation = [
  {
    label: "الرئيسية",
    href: "/platform",
    icon: "⌂",
    active: true,
  },
  {
    label: "المنافسات",
    href: "/platform/opportunities",
    icon: "☆",
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

export async function Sidebar() {
  const opportunityResult =
    await listWorkspaceOpportunitiesAction({
      page: 1,
      pageSize: 1,
    });

  const opportunityCount =
    opportunityResult.success
      ? String(opportunityResult.data.total)
      : undefined;

  return (
    <OqoodSidebar className="platformApprovedSidebar">
      <SidebarHeader>
        <div className="approvedSidebarBrand">
          <Link aria-label="OQOOD" href="/platform">
            <OqoodLogo compact inverted />
          </Link>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {navigation.map((item) => (
            <Link href={item.href} key={item.href}>
              <SidebarNavItem
                active={item.active}
                badge={
                  (item.href === "/platform/opportunities"
                    ? opportunityCount
                    : item.badge) ? (
                    <Badge size="sm" tone="primary">
                      {item.href === "/platform/opportunities"
                        ? opportunityCount
                        : item.badge}
                    </Badge>
                  ) : undefined
                }
                icon={<span>{item.icon}</span>}
                label={item.label}
              />
            </Link>
          ))}
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="approvedSidebarUser">
          <Avatar
            name="علي محمد"
            size="sm"
            status="online"
          />

          <div className="approvedSidebarUser__content">
            <strong>علي محمد</strong>
            <small>مدير المشتريات</small>
          </div>

          <button aria-label="قائمة المستخدم" type="button">
           ⌄
          </button>
        </div>

        <button className="approvedSidebarCollapse" type="button">
          <span aria-hidden="true">↔</span>
          <span>طي القائمة</span>
        </button>
      </SidebarFooter>
    </OqoodSidebar>
  );
}
