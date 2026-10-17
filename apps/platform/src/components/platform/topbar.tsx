import Link from "next/link";
import {
  Avatar,
  Badge,
  Button,
  TopNavigation,
  TopNavigationAction,
  TopNavigationUser,
} from "@oqood/design-system";
import { getOperationalNotifications } from "@/features/notifications/operational-notifications";
import { GlobalSearchBox } from "@/features/search/global-search-box";
import { requireAuthenticatedUser } from "@/features/workspace/guards";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export async function PlatformTopbar() {
  const [context, user] = await Promise.all([
    requireCurrentWorkspace(),
    requireAuthenticatedUser(),
  ]);
  const notifications = await getOperationalNotifications(context, user.id);
  const unreadCount = notifications.filter((item) => !item.read).length;

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
        <GlobalSearchBox />
      }
      end={
        <div className="approvedTopbarActions">
          <Link href="/platform/notifications">
          <TopNavigationAction
            badge={unreadCount ? <span>{unreadCount > 99 ? "99+" : unreadCount}</span> : undefined}
            label="الإشعارات"
          >
            <span aria-hidden="true">♢</span>
          </TopNavigationAction>
          </Link>

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
