import Link from "next/link";

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
      <header className={styles.header}>
        <div><span>البحث الشامل</span><h1>نتائج البحث</h1><p>نتائج موحّدة ومقيدة بصلاحياتك داخل مساحة العمل الحالية.</p></div>
        {query.length >= 2 && <div><b>{total}</b><small>نتيجة</small></div>}
      </header>
      <form action="/platform/search" className={styles.search}>
        <span aria-hidden="true">⌕</span>
        <input autoFocus defaultValue={query} name="q" placeholder="اكتب الاسم أو الرقم المرجعي أو وصف السجل..." type="search" />
        <button>بحث</button>
      </form>

      {query.length < 2 ? (
        <section className={styles.empty}><b>ابدأ بكتابة كلمتين أو رقم مرجعي</b><p>يلزم إدخال حرفين على الأقل لإجراء البحث.</p></section>
      ) : groups.length ? (
        <div className={styles.groups}>
          {groups.map((group) => <section className={styles.group} key={group.key}>
            <header><div><span>{icons[group.key]}</span><h2>{group.label}</h2></div><small>{group.results.length} نتائج</small></header>
            <div className={styles.results}>{group.results.map((result) => <Link href={result.href} key={`${result.type}-${result.id}`}>
              <span className={styles.resultIcon}>{icons[result.type]}</span>
              <div><b>{result.title}</b><span>{result.reference}{result.description ? ` · ${result.description}` : ""}</span></div>
              <div className={styles.meta}><em>{result.status}</em><small>{new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium" }).format(result.updatedAt)}</small></div>
              <i aria-hidden="true">←</i>
            </Link>)}</div>
          </section>)}
        </div>
      ) : (
        <section className={styles.empty}><b>لا توجد نتائج مطابقة لـ «{query}»</b><p>جرّب رقمًا مرجعيًا أو جزءًا أقصر من الاسم.</p></section>
      )}
    </main>
  );
}
