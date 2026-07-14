import Link from "next/link";
import {
  Avatar,
  Badge,
  Button,
  TopNavigation,
  TopNavigationAction,
  TopNavigationSearch,
  TopNavigationUser,
} from "@oqood/design-system";

export function PlatformTopbar() {
  return (
    <TopNavigation
      center={
        <TopNavigationSearch
          icon={<span>⌕</span>}
          placeholder="ابحث في الفرص، العقود، الشركاء والمستندات..."
          shortcut="Ctrl K"
        />
      }
      end={
        <>
          <TopNavigationAction
            badge={<span>4</span>}
            label="الإشعارات"
          >
            <span>♢</span>
          </TopNavigationAction>

          <TopNavigationAction label="المساعد الذكي">
            <span>✦</span>
          </TopNavigationAction>

          <TopNavigationAction label="المساعدة">
            <span>؟</span>
          </TopNavigationAction>

          <Link href="/platform/opportunities/new">
            <Button size="sm">
              + إنشاء
            </Button>
          </Link>

          <TopNavigationUser
            action={<span>⌄</span>}
            avatar={
              <Avatar
                name="علي المشمّع"
                size="sm"
                status="online"
              />
            }
            name="علي المشمّع"
            role="مدير مساحة العمل"
          />
        </>
      }
      start={
        <Badge dot tone="success">
          النظام متصل
        </Badge>
      }
    />
  );
}
