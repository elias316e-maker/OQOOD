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
      className="platformApprovedTopbar"
      start={
        <div className="approvedTopbarStatus">
          <Badge dot tone="success">
            النظام يعمل بكفاءة
          </Badge>
        </div>
      }
      center={
        <TopNavigationSearch
          icon={<span aria-hidden="true">⌕</span>}
          placeholder="ابحث في العقود، المنافسات، المشاريع والمستندات..."
          shortcut="Ctrl K"
        />
      }
      end={
        <div className="approvedTopbarActions">
          <TopNavigationAction
            badge={<span>4</span>}
            label="الإشعارات"
          >
            <span aria-hidden="true">♢</span>
          </TopNavigationAction>

          <TopNavigationAction
            badge={<span>2</span>}
            label="الرسائل"
          >
            <span aria-hidden="true">✉</span>
          </TopNavigationAction>

          <TopNavigationAction label="المساعد الذكي">
            <span aria-hidden="true">✦</span>
          </TopNavigationAction>

          <Link href="/platform/opportunities/new">
            <Button className="approvedTopbarCreate" size="sm">
              <span aria-hidden="true">＋</span>
              إنشاء جديد
            </Button>
          </Link>

          <TopNavigationUser
            action={<span aria-hidden="true">⌄</span>}
            avatar={
              <Avatar
                name="علي محمد"
                size="sm"
                status="online"
              />
            }
            name="علي محمد"
            role="مدير المشتريات"
          />
        </div>
      }
    />
  );
}
