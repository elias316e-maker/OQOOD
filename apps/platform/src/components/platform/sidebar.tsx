import Link from "next/link";

const navigationItems = [
  { label: "مركز القيادة", href: "/platform", icon: "⌂" },
  { label: "الفرص والمنافسات", href: "/platform/opportunities", icon: "◫" },
  { label: "شركاء الأعمال", href: "/platform/partners", icon: "◎" },
  { label: "المشاريع", href: "/platform/projects", icon: "◇" },
  { label: "العقود", href: "/platform/contracts", icon: "▤" },
  { label: "المستندات", href: "/platform/documents", icon: "□" },
  { label: "التقارير", href: "/platform/reports", icon: "▥" },
];

export function Sidebar() {
  return (
    <aside className="platformSidebar">
      <Link className="brand sidebarBrand" href="/">
        <span className="brandMark">ع</span>
        <span>
          <strong>عقود</strong>
          <small>OQOOD</small>
        </span>
      </Link>

      <div className="workspaceCard">
        <span className="workspaceLogo">ب</span>
        <div>
          <strong>شركة البحرين برو</strong>
          <small>مساحة العمل الرئيسية</small>
        </div>
        <button type="button">⌄</button>
      </div>

      <nav className="platformNavigation" aria-label="تنقل المنصة">
        <span className="navigationLabel">مساحة العمل</span>

        {navigationItems.map((item, index) => (
          <Link
            className={index === 0 ? "platformNavItem active" : "platformNavItem"}
            href={item.href}
            key={item.href}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}

        <span className="navigationLabel settingsLabel">الإدارة</span>

        <Link className="platformNavItem" href="/platform/settings">
          <span>⚙</span>
          الإعدادات
        </Link>
      </nav>

      <div className="sidebarUser">
        <span className="userAvatar">ع</span>
        <div>
          <strong>علي المشمّع</strong>
          <small>مدير مساحة العمل</small>
        </div>
        <button type="button">⋮</button>
      </div>
    </aside>
  );
}
