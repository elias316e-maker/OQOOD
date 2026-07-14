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
  SidebarWorkspace,
} from "@oqood/design-system";

const mainNavigation = [
  {
    label: "مركز القيادة",
    href: "/platform",
    icon: "⌂",
    active: true,
  },
  {
    label: "الفرص والمنافسات",
    href: "/platform/opportunities",
    icon: "◫",
    badge: "12",
  },
  {
    label: "شركاء الأعمال",
    href: "/platform/partners",
    icon: "◎",
  },
  {
    label: "المشاريع",
    href: "/platform/projects",
    icon: "◇",
  },
  {
    label: "العقود",
    href: "/platform/contracts",
    icon: "▤",
    badge: "3",
  },
  {
    label: "المستندات",
    href: "/platform/documents",
    icon: "□",
  },
  {
    label: "التقارير والتحليلات",
    href: "/platform/reports",
    icon: "▥",
  },
];

const administrationNavigation = [
  {
    label: "المستخدمون والصلاحيات",
    href: "/platform/users",
    icon: "♙",
  },
  {
    label: "إعدادات المنصة",
    href: "/platform/settings",
    icon: "⚙",
  },
];

export function Sidebar() {
  return (
    <OqoodSidebar>
      <SidebarHeader>
        <div className="platformSidebarLogo">
          <Link href="/">
            <OqoodLogo compact inverted />
          </Link>
        </div>

        <SidebarWorkspace
          action={<span>⌄</span>}
          description="مساحة العمل الرئيسية"
          logo="ب"
          name="شركة البحرين برو"
        />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup title="مساحة العمل">
          {mainNavigation.map((item) => (
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
                icon={item.icon}
                label={item.label}
              />
            </Link>
          ))}
        </SidebarGroup>

        <SidebarGroup title="الإدارة">
          {administrationNavigation.map((item) => (
            <Link href={item.href} key={item.href}>
              <SidebarNavItem
                icon={item.icon}
                label={item.label}
              />
            </Link>
          ))}
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="platformSidebarUser">
          <Avatar
            name="علي المشمّع"
            size="sm"
            status="online"
          />

          <div>
            <strong>علي المشمّع</strong>
            <small>مدير مساحة العمل</small>
          </div>

          <button aria-label="قائمة المستخدم" type="button">
            ⋮
          </button>
        </div>
      </SidebarFooter>
    </OqoodSidebar>
  );
}
