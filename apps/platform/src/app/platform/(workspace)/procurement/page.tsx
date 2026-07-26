import Link from "next/link";

import {
  listProcurementRequestsAction,
} from "@/features/procurement/actions";

import type {
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

type SearchParams = Record<
  string,
  string | string[] | undefined
>;

type ProcurementPageProps = {
  searchParams: Promise<SearchParams>;
};

const statuses = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "CHANGES_REQUESTED",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
  "ARCHIVED",
] as const satisfies readonly ProcurementRequestStatus[];

const priorities = [
  "LOW",
  "NORMAL",
  "HIGH",
  "URGENT",
] as const satisfies readonly ProcurementPriority[];

const statusLabels: Record<
  ProcurementRequestStatus,
  string
> = {
  DRAFT: "مسودة",
  SUBMITTED: "مرسل",
  UNDER_REVIEW: "تحت المراجعة",
  CHANGES_REQUESTED: "تعديلات مطلوبة",
  APPROVED: "معتمد",
  REJECTED: "مرفوض",
  CANCELLED: "ملغي",
  ARCHIVED: "مؤرشف",
};

const priorityLabels: Record<
  ProcurementPriority,
  string
> = {
  LOW: "منخفضة",
  NORMAL: "عادية",
  HIGH: "مرتفعة",
  URGENT: "عاجلة",
};

const statusTones: Record<
  ProcurementRequestStatus,
  "neutral" | "warning" | "info" | "success" | "danger"
> = {
  DRAFT: "neutral",
  SUBMITTED: "info",
  UNDER_REVIEW: "warning",
  CHANGES_REQUESTED: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  CANCELLED: "danger",
  ARCHIVED: "neutral",
};

function firstValue(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function enumValue<T extends string>(
  value: string | undefined,
  accepted: readonly T[],
): T | undefined {
  return accepted.includes(value as T)
    ? (value as T)
    : undefined;
}

function positiveInteger(
  value: string | undefined,
  fallback: number,
): number {
  const number = Number(value);

  return Number.isInteger(number) && number > 0
    ? number
    : fallback;
}

function formatDate(value: string | null): string {
  if (!value) {
    return "غير محدد";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "غير محدد";
  }

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
  if (!value) {
    return "غير محدد";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return `${value} ${currency}`;
  }

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

function pageHref(
  params: URLSearchParams,
  page: number,
): string {
  const next = new URLSearchParams(params);
  next.set("page", String(page));
  return `/platform/procurement?${next.toString()}`;
}

export default async function ProcurementPage({
  searchParams,
}: ProcurementPageProps) {
  const rawParams = await searchParams;
  const search =
    firstValue(rawParams.search)?.trim() || undefined;
  const status = enumValue(
    firstValue(rawParams.status),
    statuses,
  );
  const priority = enumValue(
    firstValue(rawParams.priority),
    priorities,
  );
  const page = positiveInteger(
    firstValue(rawParams.page),
    1,
  );

  const [result, workspaceContext] =
    await Promise.all([
      listProcurementRequestsAction({
        search,
        status,
        priority,
        page,
        pageSize: 20,
      }),
      requireCurrentWorkspace(),
    ]);

  const canCreate = hasPermission(
    workspaceContext,
    Permissions.procurement.create,
  );

  if (!result.success) {
    return (
      <main className={styles.page}>
        <section className={styles.panel} role="alert">
          <div className={styles.error}>
            <div>
              <h1>تعذر تحميل طلبات المشتريات</h1>
              <p>{result.message}</p>
              <Link
                className={styles.resetButton}
                href="/platform/procurement"
              >
                إعادة المحاولة
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const { items, total, totalPages } = result.data;
  const reviewCount = items.filter(
    (item) =>
      item.status === "SUBMITTED" ||
      item.status === "UNDER_REVIEW",
  ).length;
  const approvedCount = items.filter(
    (item) => item.status === "APPROVED",
  ).length;
  const urgentCount = items.filter(
    (item) => item.priority === "URGENT",
  ).length;
  const activeParams = new URLSearchParams();

  if (search) activeParams.set("search", search);
  if (status) activeParams.set("status", status);
  if (priority) activeParams.set("priority", priority);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>
            دورة الشراء الداخلية
          </span>
          <h1>طلبات المشتريات</h1>
          <p>
            متابعة الاحتياجات والبنود والمراجعات والاعتمادات
            داخل مساحة العمل الحالية.
          </p>
        </div>

        {canCreate && (
          <Link
            className={styles.createButton}
            href="/platform/procurement/new"
          >
            ＋ طلب مشتريات جديد
          </Link>
        )}
      </header>

      <section
        className={styles.summary}
        aria-label="ملخص طلبات المشتريات"
      >
        <article>
          <span>إجمالي الطلبات</span>
          <strong>{total}</strong>
          <small>داخل مساحة العمل</small>
        </article>
        <article>
          <span>بانتظار المراجعة</span>
          <strong>{reviewCount}</strong>
          <small>في الصفحة الحالية</small>
        </article>
        <article>
          <span>الطلبات المعتمدة</span>
          <strong>{approvedCount}</strong>
          <small>في الصفحة الحالية</small>
        </article>
        <article>
          <span>طلبات عاجلة</span>
          <strong>{urgentCount}</strong>
          <small>تحتاج متابعة</small>
        </article>
      </section>

      <section className={styles.panel}>
        <form className={styles.filters} method="get">
          <div className={styles.field}>
            <label htmlFor="procurement-search">
              البحث
            </label>
            <input
              defaultValue={search}
              id="procurement-search"
              name="search"
              placeholder="رقم الطلب أو العنوان أو الوصف"
              type="search"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="procurement-status">
              الحالة
            </label>
            <select
              defaultValue={status ?? ""}
              id="procurement-status"
              name="status"
            >
              <option value="">جميع الحالات</option>
              {statuses.map((value) => (
                <option key={value} value={value}>
                  {statusLabels[value]}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="procurement-priority">
              الأولوية
            </label>
            <select
              defaultValue={priority ?? ""}
              id="procurement-priority"
              name="priority"
            >
              <option value="">جميع الأولويات</option>
              {priorities.map((value) => (
                <option key={value} value={value}>
                  {priorityLabels[value]}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterActions}>
            <button
              className={styles.filterButton}
              type="submit"
            >
              تطبيق
            </button>
            <Link
              className={styles.resetButton}
              href="/platform/procurement"
            >
              مسح
            </Link>
          </div>
        </form>

        <div className={styles.resultBar}>
          <span>
            عرض {items.length} من أصل {total} طلب
          </span>
          <span>
            الصفحة {page} من {Math.max(totalPages, 1)}
          </span>
        </div>

        {items.length === 0 ? (
          <div className={styles.empty} role="status">
            <div>
              <h2>لا توجد طلبات مطابقة</h2>
              <p>
                غيّر معايير البحث أو ابدأ بإنشاء أول طلب
                مشتريات في مساحة العمل.
              </p>
            </div>
          </div>
        ) : (
          <div className={styles.tableViewport}>
            <table className={styles.table}>
              <caption className="srOnly">
                قائمة طلبات المشتريات
              </caption>
              <thead>
                <tr>
                  <th scope="col">رقم الطلب</th>
                  <th scope="col">العنوان</th>
                  <th scope="col">الحالة</th>
                  <th scope="col">الأولوية</th>
                  <th scope="col">التصنيف</th>
                  <th scope="col">تاريخ الاحتياج</th>
                  <th scope="col">القيمة التقديرية</th>
                  <th scope="col">آخر تحديث</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className={styles.requestIdentity}>
                        <strong>{item.number}</strong>
                        <small>
                          {item.projectId
                            ? "مرتبط بمشروع"
                            : "طلب عام"}
                        </small>
                      </div>
                    </td>
                    <td className={styles.titleCell}>
                      <strong>{item.title}</strong>
                      <small>
                        {item.assignedToId
                          ? "تم تعيين مسؤول"
                          : "دون مسؤول"}
                      </small>
                    </td>
                    <td>
                      <span
                        className={styles.status}
                        data-tone={statusTones[item.status]}
                      >
                        {statusLabels[item.status]}
                      </span>
                    </td>
                    <td>
                      <span
                        className={styles.priority}
                        data-priority={item.priority}
                      >
                        {priorityLabels[item.priority]}
                      </span>
                    </td>
                    <td>{item.category ?? "غير مصنف"}</td>
                    <td>{formatDate(item.requiredByDate)}</td>
                    <td>
                      <span className={styles.amount}>
                        {formatAmount(
                          item.estimatedTotal,
                          item.currency,
                        )}
                      </span>
                    </td>
                    <td>{formatDate(item.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <footer className={styles.pagination}>
          <span>
            {total === 0
              ? "لا توجد نتائج"
              : `إجمالي النتائج: ${total}`}
          </span>
          <nav aria-label="التنقل بين صفحات المشتريات">
            <Link
              aria-disabled={page <= 1}
              className={styles.pageLink}
              href={pageHref(
                activeParams,
                Math.max(1, page - 1),
              )}
            >
              السابق
            </Link>
            <Link
              aria-disabled={
                totalPages === 0 || page >= totalPages
              }
              className={styles.pageLink}
              href={pageHref(
                activeParams,
                Math.min(
                  Math.max(totalPages, 1),
                  page + 1,
                ),
              )}
            >
              التالي
            </Link>
          </nav>
        </footer>
      </section>
    </main>
  );
}
