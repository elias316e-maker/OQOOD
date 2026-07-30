"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import type { OpportunitySummaryResponse } from "../dtos";
import { OpportunityCardGrid } from "./opportunity-card-grid";
import { SortableOpportunityTable } from "./sortable-opportunity-table";

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

  return (
    <section className="approvedOpportunityWorkspace">
      <aside className="approvedOpportunityFilters" aria-label="تصفية النتائج">
        <header>
          <div><span>التحكم بالنتائج</span><h2>تصفية النتائج</h2></div>
          <span aria-hidden="true">⌁</span>
        </header>

        <label>
          <span>حالة المنافسة</span>
          <select value={status} onChange={(event) => setStatus(event.target.value as OpportunityStatus | "ALL")}>
            {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>

        <label>
          <span>نوع المنافسة</span>
          <select value={type} onChange={(event) => setType(event.target.value as OpportunityType | "ALL")}>
            {typeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>

        <label><span>الجهة المالكة</span><select disabled><option>كل الجهات</option></select></label>

        <div className="approvedOpportunityRange">
          <span>قيمة المنافسة</span>
          <input type="range" min="0" max="100" defaultValue="100" aria-label="الحد الأعلى لقيمة المنافسة" />
          <div><span>0 ر.س</span><span>10,000,000+ ر.س</span></div>
        </div>

        <label className="approvedOpportunityCheck">
          <input type="checkbox" checked={closingSoonOnly} onChange={(event) => setClosingSoonOnly(event.target.checked)} />
          <span>تنتهي خلال 7 أيام</span>
        </label>

        <button className="approvedFilterApply" type="button">تطبيق الفلاتر</button>
        <button className="approvedFilterReset" type="button" onClick={resetFilters}>مسح الفلاتر</button>
      </aside>

      <div className="approvedOpportunityResults">
        <div className="approvedOpportunityToolbar">
          <label className="approvedOpportunitySearch">
            <span aria-hidden="true">⌕</span>
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="بحث في المنافسات..." />
          </label>

          <div className="approvedOpportunitySort">
            <span>ترتيب حسب</span>
            <select aria-label="ترتيب المنافسات" defaultValue="latest">
              <option value="latest">الأحدث</option>
              <option value="deadline">موعد الإغلاق</option>
              <option value="value">القيمة</option>
            </select>
          </div>

          <div className="approvedViewToggle" aria-label="طريقة عرض المنافسات">
            <button className={view === "table" ? "isActive" : ""} type="button" onClick={() => setView("table")} aria-pressed={view === "table"}>☷</button>
            <button className={view === "cards" ? "isActive" : ""} type="button" onClick={() => setView("cards")} aria-pressed={view === "cards"}>▦</button>
          </div>

          {canCreate && <Link href="/platform/opportunities/new">＋ إنشاء منافسة جديدة</Link>}
        </div>

        <div className={view === "table" ? "approvedOpportunityTable" : "approvedOpportunityCards"}>
          {filtered.length ? (
            view === "table"
              ? <SortableOpportunityTable opportunities={filtered} />
              : <OpportunityCardGrid opportunities={[...filtered]} />
          ) : (
            <div className="approvedOpportunityEmpty">
              <strong>لا توجد نتائج مطابقة</strong>
              <span>جرّب تعديل البحث أو إزالة بعض الفلاتر.</span>
              <button type="button" onClick={resetFilters}>مسح الفلاتر</button>
            </div>
          )}
        </div>

        <footer className="approvedOpportunityPagination">
          <span>عرض {filtered.length} من {total} منافسة</span>
          <div><button type="button" disabled>‹</button><strong>{page}</strong><span>من {Math.max(totalPages, 1)}</span><button type="button" disabled>›</button></div>
        </footer>
      </div>
    </section>
  );
}
