import { SidebarNavigation } from "./sidebar-navigation";
import Link from "next/link";
import {
  Avatar,
  OqoodLogo,
  Sidebar as OqoodSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "@oqood/design-system";

import {
  listWorkspaceOpportunitiesAction,
} from "@/features/opportunity/actions/list-workspace-opportunities";



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
          <SidebarNavigation opportunityCount={opportunityCount} />
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
