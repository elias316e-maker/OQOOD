import Link from "next/link";

import {
  EmptyState,
  WorkspaceHeader,
  FormSection,
} from "@oqood/design-system";

import { searchWorkspace } from "@/features/search/global-search";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

import styles from "./search.module.css";

type PageProps = { searchParams: Promise<{ q?: string }> };

const icons = {
  project: "♙",
  procurement: "◆",
  opportunity: "☆",
  contract: "▣",
  partner: "♧",
  document: "□",
};

export default async function SearchPage({ searchParams }: PageProps) {
  const [{ q = "" }, context] = await Promise.all([searchParams, requireCurrentWorkspace()]);
  const query = q.trim();
  const groups = await searchWorkspace(context, query);
  const total = groups.reduce((count, group) => count + group.results.length, 0);

  return (
    <main className={styles.page}>
      <WorkspaceHeader
        className={styles.workspaceHeader}
        eyebrow="البحث الشامل"
        title="نتائج البحث"
        description="نتائج موحّدة ومقيدة بصلاحياتك داخل مساحة العمل الحالية."
        actions={
          query.length >= 2 ? (
            <div
              aria-label={`${total} نتيجة بحث`}
              className={styles.resultSummary}
              role="status"
            >
              <strong>{total}</strong>
              <span>نتيجة</span>
            </div>
          ) : null
        }
      />
      <form
        action="/platform/search"
        aria-label="البحث الشامل في مساحة العمل"
        className={styles.search}
        role="search"
      >
        <span aria-hidden="true">
          ⌕
        </span>

        <input
          aria-label="عبارة البحث"
          autoFocus
          defaultValue={query}
          maxLength={120}
          name="q"
          placeholder="اكتب الاسم أو الرقم المرجعي أو وصف السجل..."
          type="search"
        />

        <button type="submit">
          بحث
        </button>
      </form>

      {query.length < 2 ? (
        <EmptyState
          className={styles.searchState}
          tone="info"
          icon="⌕"
          title="ابدأ بكتابة اسم أو رقم مرجعي"
          description="يلزم إدخال حرفين على الأقل لإجراء البحث داخل مساحة العمل."
          role="status"
        />
      ) : groups.length ? (
        <div
          aria-label="مجموعات نتائج البحث"
          className={styles.groups}
        >
          {groups.map((group) => (
            <FormSection
              className={styles.searchGroup}
              eyebrow={
                <span
                  className={
                    styles.groupIdentity
                  }
                >
                  <span aria-hidden="true">
                    {icons[group.key]}
                  </span>

                  <span>فئة النتائج</span>
                </span>
              }
              title={group.label}
              description="نتائج مرتبة حسب آخر تحديث ومقيدة بصلاحياتك الحالية."
              actions={
                <small
                  className={
                    styles.groupCount
                  }
                >
                  {group.results.length} نتيجة
                </small>
              }
              key={group.key}
            >
              <div
                className={styles.results}
                role="list"
              >
                {group.results.map(
                  (result) => (
                    <Link
                      aria-label={`فتح ${result.title}`}
                      href={result.href}
                      key={`${result.type}-${result.id}`}
                      role="listitem"
                    >
                      <span
                        aria-hidden="true"
                        className={
                          styles.resultIcon
                        }
                      >
                        {icons[result.type]}
                      </span>

                      <div
                        className={
                          styles.resultBody
                        }
                      >
                        <strong
                          className={
                            styles.resultTitle
                          }
                        >
                          {result.title}
                        </strong>

                        <span
                          className={
                            styles.resultDescription
                          }
                        >
                          {result.reference}

                          {result.description
                            ? ` · ${result.description}`
                            : ""}
                        </span>
                      </div>

                      <div
                        className={
                          styles.meta
                        }
                      >
                        <span
                          className={
                            styles.resultStatus
                          }
                          data-status={
                            result.status
                          }
                        >
                          {result.status}
                        </span>

                        <time
                          className={
                            styles.resultDate
                          }
                          dateTime={
                            result.updatedAt.toISOString()
                          }
                        >
                          {new Intl.DateTimeFormat(
                            "ar-SA",
                            {
                              dateStyle:
                                "medium",
                            },
                          ).format(
                            result.updatedAt,
                          )}
                        </time>
                      </div>

                      <span
                        aria-hidden="true"
                        className={
                          styles.resultArrow
                        }
                      >
                        ←
                      </span>
                    </Link>
                  ),
                )}
              </div>
            </FormSection>
          ))}
        </div>
      ) : (
        <EmptyState
          className={styles.searchState}
          tone="neutral"
          icon="⌕"
          title={`لا توجد نتائج مطابقة لـ «${query}»`}
          description="جرّب رقمًا مرجعيًا أو جزءًا أقصر من الاسم أو الوصف."
          role="status"
        />
      )}
    </main>
  );
}
