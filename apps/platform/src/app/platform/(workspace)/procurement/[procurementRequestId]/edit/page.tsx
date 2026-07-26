import Link from "next/link";

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
          <div className="emptyState" role="alert">
            <h1>تعذر تحميل طلب المشتريات</h1>
            <p>{result.message}</p>
            <Link href="/platform/procurement">
              العودة إلى قائمة الطلبات
            </Link>
          </div>
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
          <div className="emptyState" role="alert">
            <h1>لا يمكن تعديل هذا الطلب</h1>
            <p>
              التعديل متاح للمسودات والطلبات المعادة للتعديل فقط،
              ويتطلب صلاحية تحديث المشتريات.
            </p>
            <Link
              href={`/platform/procurement/${result.data.id}`}
            >
              العودة إلى تفاصيل الطلب
            </Link>
          </div>
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
