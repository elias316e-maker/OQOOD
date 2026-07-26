import Link from "next/link";

import {
  getProcurementRequestAction,
} from "@/features/procurement/actions";
import {
  ProcurementLifecycleActions,
} from "@/features/procurement/components";
import type {
  ProcurementItemType,
  ProcurementPriority,
  ProcurementRequestStatus,
} from "@/generated/prisma/client";
import {
  hasPermission,
  Permissions,
} from "@/lib/permissions";
import {
  requireCurrentWorkspace,
} from "@/lib/workspace-context";

import styles from "./page.module.css";

type Props = {
  params: Promise<{
    procurementRequestId: string;
  }>;
};

const statusLabels: Record<ProcurementRequestStatus, string> = {
  DRAFT: "مسودة",
  SUBMITTED: "مرسل للمراجعة",
  UNDER_REVIEW: "تحت المراجعة",
  CHANGES_REQUESTED: "تعديلات مطلوبة",
  APPROVED: "معتمد",
  REJECTED: "مرفوض",
  CANCELLED: "ملغي",
  ARCHIVED: "مؤرشف",
};

const priorityLabels: Record<ProcurementPriority, string> = {
  LOW: "منخفضة",
  NORMAL: "عادية",
  HIGH: "مرتفعة",
  URGENT: "عاجلة",
};

const itemTypeLabels: Record<ProcurementItemType, string> = {
  MATERIAL: "مواد",
  SERVICE: "خدمة",
  WORK: "أعمال",
};

const lifecycle: ProcurementRequestStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
];

function formatDate(value: string | null): string {
  if (!value) return "غير محدد";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "غير محدد";
  return new Intl.DateTimeFormat("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatAmount(
  value: string | null,
  currency: string,
): string {
  if (!value) return "غير محدد";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return `${value} ${currency}`;
  try {
    return new Intl.NumberFormat("ar-SA", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString("ar-SA")} ${currency}`;
  }
}

export default async function ProcurementDetailsPage({
  params,
}: Props) {
  const { procurementRequestId } = await params;
  const [result, workspaceContext] = await Promise.all([
    getProcurementRequestAction({ procurementRequestId }),
    requireCurrentWorkspace(),
  ]);

  if (!result.success) {
    return (
      <main className={styles.page}>
        <section className={styles.error} role="alert">
          <h1>تعذر تحميل طلب المشتريات</h1>
          <p>{result.message}</p>
          <Link href="/platform/procurement">
            العودة إلى قائمة الطلبات
          </Link>
        </section>
      </main>
    );
  }

  const request = result.data;
  const canUpdate = hasPermission(
    workspaceContext,
    Permissions.procurement.update,
  );
  const canApprove = hasPermission(
    workspaceContext,
    Permissions.procurement.approve,
  );
  const canArchive = hasPermission(
    workspaceContext,
    Permissions.procurement.delete,
  );
  const currentStep = lifecycle.indexOf(request.status);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>
            تفاصيل طلب المشتريات
          </span>
          <h1>{request.title}</h1>
          <p>
            {request.number} · {statusLabels[request.status]}
          </p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/platform/procurement">
            العودة للقائمة
          </Link>
          <ProcurementLifecycleActions
            canApprove={canApprove}
            canArchive={canArchive}
            canUpdate={canUpdate}
            request={{
              id: request.id,
              status: request.status,
              itemCount: request.items.length,
            }}
          />
        </div>
      </header>

      <nav
        aria-label="أقسام طلب المشتريات"
        className={styles.tabs}
      >
        <a className={styles.activeTab} href="#overview">
          المعلومات الأساسية
        </a>
        <a href="#lifecycle">مسار الطلب</a>
        <a href="#items">بنود الطلب</a>
        <a href="#description">الوصف والنطاق</a>
      </nav>

      <section className={styles.summary} id="overview">
        <article>
          <span>الحالة</span>
          <strong>{statusLabels[request.status]}</strong>
          <small>آخر تحديث {formatDate(request.updatedAt)}</small>
        </article>
        <article>
          <span>الأولوية</span>
          <strong>{priorityLabels[request.priority]}</strong>
          <small>{request.category ?? "غير مصنف"}</small>
        </article>
        <article>
          <span>تاريخ الاحتياج</span>
          <strong>{formatDate(request.requiredByDate)}</strong>
          <small>{request.items.length} بنود</small>
        </article>
        <article>
          <span>القيمة التقديرية</span>
          <strong>
            {formatAmount(
              request.estimatedTotal,
              request.currency,
            )}
          </strong>
          <small>العملة {request.currency}</small>
        </article>
      </section>

      <section className={styles.panel} id="lifecycle">
        <div className={styles.panelHeader}>
          <div>
            <span className={styles.eyebrow}>مسار الطلب</span>
            <h2>مرحلة المعالجة الحالية</h2>
          </div>
          <span className={styles.statusBadge}>
            {statusLabels[request.status]}
          </span>
        </div>
        <ol className={styles.lifecycle}>
          {lifecycle.map((status, index) => (
            <li
              data-active={
                request.status === status ||
                (currentStep >= 0 && index <= currentStep)
              }
              key={status}
            >
              <span>{index + 1}</span>
              <strong>{statusLabels[status]}</strong>
            </li>
          ))}
        </ol>
        {currentStep < 0 && (
          <p className={styles.lifecycleNote}>
            توقف المسار بالحالة: {statusLabels[request.status]}.
          </p>
        )}
      </section>

      <section className={styles.panel}>
        <div className={styles.infoGrid}>
          <article>
            <span>رقم الطلب</span>
            <strong>{request.number}</strong>
          </article>
          <article>
            <span>الارتباط بمشروع</span>
            <strong>
              {request.projectId ? "مرتبط بمشروع" : "طلب عام"}
            </strong>
          </article>
          <article>
            <span>المسؤول</span>
            <strong>
              {request.assignedToId ? "تم تعيين مسؤول" : "غير معين"}
            </strong>
          </article>
          <article>
            <span>تاريخ الإنشاء</span>
            <strong>{formatDate(request.createdAt)}</strong>
          </article>
        </div>
      </section>

      <section className={styles.panel} id="items">
        <div className={styles.panelHeader}>
          <div>
            <span className={styles.eyebrow}>تفاصيل الاحتياج</span>
            <h2>بنود طلب المشتريات</h2>
          </div>
          <strong>{request.items.length} بنود</strong>
        </div>
        {request.items.length === 0 ? (
          <p className={styles.empty}>
            لم تتم إضافة بنود إلى هذا الطلب بعد.
          </p>
        ) : (
          <div className={styles.tableViewport}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>النوع والوصف</th>
                  <th>الكمية</th>
                  <th>الموقع</th>
                  <th>تاريخ الاحتياج</th>
                  <th>سعر الوحدة</th>
                  <th>الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {request.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.lineNumber}</td>
                    <td className={styles.itemDescription}>
                      <strong>{item.description}</strong>
                      <small>
                        {itemTypeLabels[item.type]}
                        {item.specification
                          ? ` · ${item.specification}`
                          : ""}
                      </small>
                    </td>
                    <td>{item.quantity} {item.unit}</td>
                    <td>{item.deliveryLocation ?? "غير محدد"}</td>
                    <td>{formatDate(item.requiredByDate)}</td>
                    <td>
                      {formatAmount(
                        item.estimatedUnitPrice,
                        request.currency,
                      )}
                    </td>
                    <td>
                      {formatAmount(
                        item.estimatedTotal,
                        request.currency,
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={styles.panel} id="description">
        <div className={styles.panelHeader}>
          <div>
            <span className={styles.eyebrow}>النطاق</span>
            <h2>وصف الطلب</h2>
          </div>
        </div>
        <p className={styles.description}>
          {request.description ??
            "لم تتم إضافة وصف تفصيلي لهذا الطلب."}
        </p>
      </section>
    </main>
  );
}
