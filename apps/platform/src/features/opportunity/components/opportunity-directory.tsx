"use client";

import styles from "./opportunity-directory.module.css";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge, Button, DataTable, EmptyState, Input, Select, type DataTableColumn } from "@oqood/design-system";

import type { OpportunitySummaryResponse } from "../dtos";
import { OpportunityCardGrid } from "./opportunity-card-grid";

type DirectoryView = "table" | "cards";
type OpportunityStatus = OpportunitySummaryResponse["status"];
type OpportunityType = OpportunitySummaryResponse["type"];

type OpportunityDirectoryProps = {
  opportunities: readonly OpportunitySummaryResponse[];
  total: number;
  page: number;
  totalPages: number;
  canCreate: boolean;
};

const statusOptions: Array<{ value: OpportunityStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "كل الحالات" },
  { value: "PUBLISHED", label: "مفتوحة" },
  { value: "TECHNICAL_EVALUATION", label: "قيد التقييم" },
  { value: "AWARDED", label: "مكتملة" },
  { value: "CLOSED", label: "مغلقة" },
];

const typeOptions: Array<{ value: OpportunityType | "ALL"; label: string }> = [
  { value: "ALL", label: "كل الأنواع" },
  { value: "RFQ", label: "طلب عرض سعر" },
  { value: "RFP", label: "طلب تقديم عرض" },
  { value: "TENDER", label: "منافسة" },
  { value: "DIRECT_PURCHASE", label: "شراء مباشر" },
  { value: "SERVICE_REQUEST", label: "طلب خدمة" },
];

const statusLabels: Record<OpportunityStatus, string> = {
  DRAFT: "مسودة",
  PENDING_APPROVAL: "بانتظار الاعتماد",
  APPROVED: "معتمدة",
  PUBLISHED: "مفتوحة",
  CLARIFICATION: "مرحلة الاستفسارات",
  SUBMISSION_CLOSED: "أُغلق التقديم",
  TECHNICAL_EVALUATION: "قيد التقييم",
  FINANCIAL_EVALUATION: "قيد التقييم",
  NEGOTIATION: "تفاوض",
  AWARD_PENDING: "بانتظار الترسية",
  AWARDED: "مكتملة",
  CANCELLED: "ملغاة",
  CLOSED: "منتهية",
  ARCHIVED: "مؤرشفة",
};

const typeLabels: Record<OpportunityType, string> = {
  RFQ: "طلب عرض سعر",
  RFP: "طلب تقديم عرض",
  TENDER: "منافسة",
  DIRECT_PURCHASE: "شراء مباشر",
  SERVICE_REQUEST: "طلب خدمة",
  SUBCONTRACT: "مقاولة من الباطن",
};

function formatDate(value: string | null) {
  if (!value) return "غير محدد";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "غير محدد";
  return new Intl.DateTimeFormat("ar-SA", { year: "numeric", month: "short", day: "numeric" }).format(date);
}

function formatBudget(opportunity: OpportunitySummaryResponse) {
  if (!opportunity.budget) return "غير محدد";
  const value = Number(opportunity.budget);
  if (!Number.isFinite(value)) return `${opportunity.budget} ${opportunity.currency}`;
  return `${new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 0 }).format(value)} ${opportunity.currency}`;
}

function statusTone(status: OpportunityStatus) {
  if (["PUBLISHED", "APPROVED"].includes(status)) return "success";
  if (["TECHNICAL_EVALUATION", "FINANCIAL_EVALUATION", "NEGOTIATION", "AWARD_PENDING"].includes(status)) return "warning";
  if (["CANCELLED"].includes(status)) return "danger";
  if (["AWARDED", "CLOSED"].includes(status)) return "info";
  return "neutral";
}

function isClosingSoon(opportunity: OpportunitySummaryResponse) {
  if (!opportunity.closingDate) return false;
  const remaining = new Date(opportunity.closingDate).getTime() - Date.now();
  return remaining > 0 && remaining <= 7 * 24 * 60 * 60 * 1000;
}

export function OpportunityDirectory({
  opportunities,
  total,
  page,
  totalPages,
  canCreate,
}: OpportunityDirectoryProps) {
  const [view, setView] = useState<DirectoryView>("table");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<OpportunityStatus | "ALL">("ALL");
  const [type, setType] = useState<OpportunityType | "ALL">("ALL");
  const [closingSoonOnly, setClosingSoonOnly] = useState(false);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ar");

    return opportunities.filter((opportunity) => {
      const matchesQuery =
        !normalizedQuery ||
        opportunity.title.toLocaleLowerCase("ar").includes(normalizedQuery) ||
        opportunity.number.toLocaleLowerCase("ar").includes(normalizedQuery);

      return (
        matchesQuery &&
        (status === "ALL" || opportunity.status === status) &&
        (type === "ALL" || opportunity.type === type) &&
        (!closingSoonOnly || isClosingSoon(opportunity))
      );
    });
  }, [closingSoonOnly, opportunities, query, status, type]);

  function resetFilters() {
    setQuery("");
    setStatus("ALL");
    setType("ALL");
    setClosingSoonOnly(false);
  }

  const columns: readonly DataTableColumn<OpportunitySummaryResponse>[] = [
    { id: "opportunity", header: "المنافسة", cell: (item) => (
      <Link className={styles.identity} href={`/platform/opportunities/${item.id}`}>
        <strong>{item.title}</strong><small>{item.number}</small>
      </Link>
    ) },
    { id: "owner", header: "الجهة المالكة", cell: () => "مساحة العمل الحالية" },
    { id: "type", header: "نوع المنافسة", cell: (item) => (
      <Badge tone="neutral">{typeLabels[item.type]}</Badge>
    ) },
    { id: "budget", header: "قيمة المنافسة", cell: (item) => (
      <strong>{formatBudget(item)}</strong>
    ) },
    { id: "closingDate", header: "تاريخ الإغلاق", cell: (item) => (
      <><span>{formatDate(item.closingDate)}</span><small>{isClosingSoon(item) ? "تنتهي قريبًا" : "موعد التقديم"}</small></>
    ) },
    { id: "status", header: "الحالة", cell: (item) => (
      <Badge tone={statusTone(item.status)}>{statusLabels[item.status]}</Badge>
    ) },
  ];

  return (
    <section className={styles.workspace}>
      <aside className={styles.filters} aria-label="تصفية النتائج">
        <header>
          <div><span>التحكم بالنتائج</span><h2>تصفية النتائج</h2></div>
          <span aria-hidden="true">⌁</span>
        </header>

        <Select id="opportunity-status" label="حالة المنافسة" value={status} onChange={(event) => setStatus(event.target.value as OpportunityStatus | "ALL")}>
            {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </Select>

        <Select id="opportunity-type" label="نوع المنافسة" value={type} onChange={(event) => setType(event.target.value as OpportunityType | "ALL")}>
            {typeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </Select>



        <label className={styles.check}>
          <input type="checkbox" checked={closingSoonOnly} onChange={(event) => setClosingSoonOnly(event.target.checked)} />
          <span>تنتهي خلال 7 أيام</span>
        </label>

        <Button variant="outline" onClick={resetFilters}>مسح الفلاتر</Button>
      </aside>

      <div className={styles.results}>
        <div className={styles.toolbar}>
          <div className={styles.search}>
            <Input id="opportunity-search" aria-label="بحث في المنافسات" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="بحث في المنافسات..." />
          </div>


          <div className={styles.viewToggle} role="group" aria-label="طريقة عرض المنافسات">
            <Button variant={view === "table" ? "primary" : "ghost"} onClick={() => setView("table")} aria-pressed={view === "table"}>جدول</Button>
            <Button variant={view === "cards" ? "primary" : "ghost"} onClick={() => setView("cards")} aria-pressed={view === "cards"}>بطاقات</Button>
          </div>

          {canCreate && <Link className="odsButton odsButton--primary odsButton--md" href="/platform/opportunities/new">＋ إنشاء منافسة جديدة</Link>}
        </div>

        <div className={styles.content}>
          {filtered.length ? (
            view === "table"
              ? (
                <DataTable
                  caption="قائمة المنافسات"
                  columns={columns}
                  rows={filtered}
                  getRowKey={(item) => item.id}
                  rowActions={(item) => (
                    <Link className="odsButton odsButton--ghost odsButton--md" href={`/platform/opportunities/${item.id}`} aria-label={`عرض تفاصيل ${item.title}`}>عرض التفاصيل</Link>
                  )}
                />
              )
              : <OpportunityCardGrid opportunities={[...filtered]} />
          ) : (
            <EmptyState
              role="status"
              title="لا توجد نتائج مطابقة"
              description="جرّب تعديل البحث أو إزالة بعض الفلاتر."
              actions={<Button variant="outline" onClick={resetFilters}>مسح الفلاتر</Button>}
            />
          )}
        </div>

        <footer className={styles.pagination}>
          <span>عرض {filtered.length} من {total} منافسة</span>
          <span>الصفحة {page} من {Math.max(totalPages, 1)}</span>
        </footer>
      </div>
    </section>
  );
}
