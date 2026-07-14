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
    badge: "12",
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

export function Sidebar() {
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
                  item.badge ? (
                    <Badge size="sm" tone="primary">
                      {item.badge}
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
