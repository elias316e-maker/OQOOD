"use client";

import {
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  DataTable,
  type DataTableColumn,
} from "@oqood/design-system";

import type {
  OpportunitySummaryResponse,
} from "../dtos";

type OpportunityStatus =
  OpportunitySummaryResponse["status"];

type OpportunityType =
  OpportunitySummaryResponse["type"];

type SortDirection =
  | "ascending"
  | "descending";

type SortColumn =
  | "number"
  | "title"
  | "type"
  | "closingDate"
  | "budget"
  | "status";

type SortState = {
  column: SortColumn;
  direction: SortDirection;
};

type SortableOpportunityTableProps = {
  opportunities:
    readonly OpportunitySummaryResponse[];
};

const typeLabels: Record<
  OpportunityType,
  string
> = {
  RFQ: "طلب عرض سعر",
  RFP: "طلب تقديم عرض",
  TENDER: "منافسة",
  DIRECT_PURCHASE: "شراء مباشر",
  SERVICE_REQUEST: "طلب خدمة",
  SUBCONTRACT: "مقاولة من الباطن",
};

const statusLabels: Record<
  OpportunityStatus,
  string
> = {
  DRAFT: "مسودة",
  PENDING_APPROVAL: "بانتظار الاعتماد",
  APPROVED: "معتمدة",
  PUBLISHED: "منشورة",
  CLARIFICATION: "مرحلة الاستفسارات",
  SUBMISSION_CLOSED: "أغلق التقديم",
  TECHNICAL_EVALUATION: "تقييم فني",
  FINANCIAL_EVALUATION: "تقييم مالي",
  NEGOTIATION: "تفاوض",
  AWARD_PENDING: "بانتظار الترسية",
  AWARDED: "تمت الترسية",
  CANCELLED: "ملغاة",
  CLOSED: "مغلقة",
  ARCHIVED: "مؤرشفة",
};

const statusClasses: Record<
  OpportunityStatus,
  string
> = {
  DRAFT: "neutral",
  PENDING_APPROVAL: "warning",
  APPROVED: "info",
  PUBLISHED: "success",
  CLARIFICATION: "info",
  SUBMISSION_CLOSED: "neutral",
  TECHNICAL_EVALUATION: "warning",
  FINANCIAL_EVALUATION: "warning",
  NEGOTIATION: "warning",
  AWARD_PENDING: "warning",
  AWARDED: "success",
  CANCELLED: "danger",
  CLOSED: "neutral",
  ARCHIVED: "neutral",
};

function formatDate(
  value: string | null,
): string {
  if (!value) {
    return "غير محدد";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "غير محدد";
  }

  return new Intl.DateTimeFormat(
    "ar-SA",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  ).format(date);
}

function formatBudget(
  budget: string | null,
  currency: string,
): string {
  if (!budget) {
    return "غير محدد";
  }

  const value = Number(budget);

  if (!Number.isFinite(value)) {
    return `${budget} ${currency}`;
  }

  try {
    return new Intl.NumberFormat(
      "ar-SA",
      {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      },
    ).format(value);
  } catch {
    return `${value.toLocaleString(
      "ar-SA",
    )} ${currency}`;
  }
}

function compareNullableStrings(
  left: string | null,
  right: string | null,
): number {
  if (left === right) {
    return 0;
  }

  if (left === null) {
    return 1;
  }

  if (right === null) {
    return -1;
  }

  return left.localeCompare(
    right,
    "ar",
    {
      numeric: true,
      sensitivity: "base",
    },
  );
}

function compareOpportunities(
  left: OpportunitySummaryResponse,
  right: OpportunitySummaryResponse,
  column: SortColumn,
): number {
  switch (column) {
    case "number":
      return compareNullableStrings(
        left.number,
        right.number,
      );

    case "title":
      return compareNullableStrings(
        left.title,
        right.title,
      );

    case "type":
      return compareNullableStrings(
        typeLabels[left.type],
        typeLabels[right.type],
      );

    case "closingDate": {
      const leftValue =
        left.closingDate
          ? new Date(
              left.closingDate,
            ).getTime()
          : Number.POSITIVE_INFINITY;

      const rightValue =
        right.closingDate
          ? new Date(
              right.closingDate,
            ).getTime()
          : Number.POSITIVE_INFINITY;

      return leftValue - rightValue;
    }

    case "budget": {
      const leftValue =
        left.budget === null
          ? Number.POSITIVE_INFINITY
          : Number(left.budget);

      const rightValue =
        right.budget === null
          ? Number.POSITIVE_INFINITY
          : Number(right.budget);

      return leftValue - rightValue;
    }

    case "status":
      return compareNullableStrings(
        statusLabels[left.status],
        statusLabels[right.status],
      );
  }
}

export function SortableOpportunityTable({
  opportunities,
}: SortableOpportunityTableProps) {
  const [sort, setSort] =
    useState<SortState>({
      column: "number",
      direction: "descending",
    });

  function toggleSort(
    column: SortColumn,
  ) {
    setSort((current) => {
      if (current.column === column) {
        return {
          column,
          direction:
            current.direction ===
            "ascending"
              ? "descending"
              : "ascending",
        };
      }

      return {
        column,
        direction: "ascending",
      };
    });
  }

  function sortHeader(
    label: string,
    column: SortColumn,
  ) {
    const isActive =
      sort.column === column;

    const directionLabel =
      isActive
        ? sort.direction ===
          "ascending"
          ? "تصاعديًا"
          : "تنازليًا"
        : "غير مرتب";

    return (
      <button
        className={
          isActive
            ? "oqDataTableSortButton isActive"
            : "oqDataTableSortButton"
        }
        type="button"
        onClick={() =>
          toggleSort(column)
        }
        aria-label={
          `ترتيب ${label}. ` +
          `الحالة الحالية: ${directionLabel}`
        }
      >
        <span>{label}</span>

        <span
          className="oqDataTableSortIcon"
          aria-hidden="true"
        >
          {isActive
            ? sort.direction ===
              "ascending"
              ? "↑"
              : "↓"
            : "↕"}
        </span>
      </button>
    );
  }

  const sortedOpportunities =
    useMemo(() => {
      const items = [
        ...opportunities,
      ];

      items.sort(
        (left, right) => {
          const result =
            compareOpportunities(
              left,
              right,
              sort.column,
            );

          return sort.direction ===
            "ascending"
            ? result
            : -result;
        },
      );

      return items;
    }, [
      opportunities,
      sort,
    ]);

  const columns =
    useMemo(
      () =>
        [
          {
            id: "number",
            header: sortHeader(
              "رقم الفرصة",
              "number",
            ),
            cell: (
              opportunity:
                OpportunitySummaryResponse,
            ) => (
              <Link
                className="tablePrimaryLink"
                href={
                  `/platform/opportunities/` +
                  opportunity.id
                }
              >
                {opportunity.number}
              </Link>
            ),
            width: "10rem",
          },
          {
            id: "title",
            header: sortHeader(
              "العنوان",
              "title",
            ),
            cell: (
              opportunity:
                OpportunitySummaryResponse,
            ) => (
              <strong>
                {opportunity.title}
              </strong>
            ),
            width: "18rem",
          },
          {
            id: "type",
            header: sortHeader(
              "النوع",
              "type",
            ),
            cell: (
              opportunity:
                OpportunitySummaryResponse,
            ) =>
              typeLabels[
                opportunity.type
              ],
            width: "10rem",
          },
          {
            id: "project",
            header: "المشروع",
            cell: () =>
              "غير مرتبط بمشروع",
            width: "11rem",
          },
          {
            id: "closingDate",
            header: sortHeader(
              "موعد الإغلاق",
              "closingDate",
            ),
            cell: (
              opportunity:
                OpportunitySummaryResponse,
            ) =>
              formatDate(
                opportunity.closingDate,
              ),
            width: "10rem",
          },
          {
            id: "offers",
            header: "العروض",
            cell: () => "—",
            align: "center",
            width: "6rem",
          },
          {
            id: "budget",
            header: sortHeader(
              "القيمة التقديرية",
              "budget",
            ),
            cell: (
              opportunity:
                OpportunitySummaryResponse,
            ) =>
              formatBudget(
                opportunity.budget,
                opportunity.currency,
              ),
            align: "end",
            width: "12rem",
          },
          {
            id: "status",
            header: sortHeader(
              "الحالة",
              "status",
            ),
            cell: (
              opportunity:
                OpportunitySummaryResponse,
            ) => (
              <span
                className={
                  `status ` +
                  statusClasses[
                    opportunity.status
                  ]
                }
              >
                {
                  statusLabels[
                    opportunity.status
                  ]
                }
              </span>
            ),
            width: "10rem",
          },
        ] satisfies readonly DataTableColumn<
          OpportunitySummaryResponse
        >[],
      [sort],
    );

  return (
    <DataTable
      caption="قائمة الفرص والمنافسات"
      columns={columns}
      rows={sortedOpportunities}
      getRowKey={(
        opportunity,
      ) => opportunity.id}
      getRowLabel={(
        opportunity,
      ) =>
        `الفرصة ${opportunity.number}: ${opportunity.title}`
      }
      rowActions={(
        opportunity,
      ) => (
        <Link
          className="tableActionButton"
          href={
            `/platform/opportunities/` +
            opportunity.id
          }
          aria-label={
            `عرض تفاصيل الفرصة ` +
            opportunity.number
          }
        >
          ⋮
        </Link>
      )}
      rowActionsHeader={
        <span className="srOnly">
          الإجراءات
        </span>
      }
    />
  );
}
