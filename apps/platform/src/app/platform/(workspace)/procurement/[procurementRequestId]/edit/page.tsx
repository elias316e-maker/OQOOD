import Link from "next/link";

import {
  EmptyState,
} from "@oqood/design-system";

import {
  getProcurementRequestAction,
} from "@/features/procurement/actions";
import {
  ProcurementCreateForm,
} from "@/features/procurement/components";
import {
  hasPermission,
  Permissions,
} from "@/lib/permissions";
import {
  requireCurrentWorkspace,
} from "@/lib/workspace-context";

type Props = {
  params: Promise<{
    procurementRequestId: string;
  }>;
};

export default async function EditProcurementRequestPage({
  params,
}: Props) {
  const { procurementRequestId } = await params;
  const [result, workspaceContext] = await Promise.all([
    getProcurementRequestAction({ procurementRequestId }),
    requireCurrentWorkspace(),
  ]);

  if (!result.success) {
    return (
      <main className="platformContent">
        <section className="dashboardPanel">
                    <EmptyState
            tone="danger"
            icon="!"
            title="تعذر تحميل طلب المشتريات"
            description={result.message}
            role="alert"
            aria-live="assertive"
            actions={
              <Link href="/platform/procurement">
                            العودة إلى قائمة الطلبات
                          </Link>
            }
          />
        </section>
      </main>
    );
  }

  const canUpdate = hasPermission(
    workspaceContext,
    Permissions.procurement.update,
  );
  const editable =
    result.data.status === "DRAFT" ||
    result.data.status === "CHANGES_REQUESTED";

  if (!canUpdate || !editable) {
    return (
      <main className="platformContent">
        <section className="dashboardPanel">
                    <EmptyState
            tone="warning"
            icon="⌁"
            title="لا يمكن تعديل هذا الطلب"
            description="التعديل متاح للمسودات والطلبات المعادة للتعديل فقط، ويتطلب صلاحية تحديث المشتريات."
            role="alert"
            aria-live="polite"
            actions={
              <Link
                            href={`/platform/procurement/${result.data.id}`}
                          >
                            العودة إلى تفاصيل الطلب
                          </Link>
            }
          />
        </section>
      </main>
    );
  }

  return (
    <ProcurementCreateForm
      defaultCurrency={result.data.currency}
      draftNumber={result.data.number}
      initialRequest={result.data}
    />
  );
}
