import Link from "next/link";

import { hasPermission, Permissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

import styles from "./documents.module.css";

const entityLabels: Record<string, string> = {
  WORKSPACE: "مساحة العمل",
  PROCUREMENT_REQUEST: "طلب مشتريات",
  OPPORTUNITY: "منافسة",
  OFFER: "عرض",
  CONTRACT: "عقد",
  BUSINESS_PARTNER: "مورد",
  PROJECT: "مشروع",
};

const statusLabels: Record<string, string> = {
  DRAFT: "مسودة",
  PENDING_REVIEW: "بانتظار المراجعة",
  APPROVED: "معتمد",
  REJECTED: "مرفوض",
  EXPIRED: "منتهي",
  ARCHIVED: "مؤرشف",
};

function formatSize(bytes: bigint | number) {
  const size = Number(bytes);
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)} ك.ب`;
  return `${(size / 1024 / 1024).toFixed(1)} م.ب`;
}

export default async function DocumentsPage() {
  const context = await requireCurrentWorkspace();
  const canRead =
    hasPermission(context, Permissions.workspace.read) ||
    hasPermission(context, Permissions.opportunities.read) ||
    hasPermission(context, Permissions.contracts.read) ||
    hasPermission(context, Permissions.procurement.read) ||
    hasPermission(context, Permissions.vendors.read);

  if (!canRead) {
    return <main className={styles.page}><section className={styles.empty}>لا تملك صلاحية الاطلاع على المستندات.</section></main>;
  }

  const documents = await prisma.document.findMany({
    where: { workspaceId: context.workspace.id },
    include: { uploadedBy: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
  });

  // Request time is required for live expiry indicators.
  // eslint-disable-next-line react-hooks/purity
  const now = new Date();
  const inThirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const totalSize = documents.reduce((sum, item) => sum + Number(item.sizeBytes), 0);
  const approved = documents.filter((item) => item.reviewStatus === "APPROVED").length;
  const pending = documents.filter((item) => item.reviewStatus === "PENDING_REVIEW").length;
  const expiring = documents.filter(
    (item) => item.expiresAt && item.expiresAt >= now && item.expiresAt <= inThirtyDays,
  ).length;
  const confidential = documents.filter((item) => item.isConfidential).length;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <span>مستودع موحّد وآمن</span>
          <h1>مركز المستندات</h1>
          <p>الوصول إلى ملفات المشتريات والمنافسات والعقود والموردين من مكان واحد.</p>
        </div>
        <button type="button" disabled title="يتطلب تهيئة مزود التخزين">رفع مستند جديد</button>
      </header>

      <section className={styles.kpis}>
        <article><span>إجمالي المستندات</span><strong>{documents.length}</strong><small>{formatSize(totalSize)}</small></article>
        <article><span>المستندات المعتمدة</span><strong>{approved}</strong><small>جاهزة للاستخدام</small></article>
        <article><span>بانتظار المراجعة</span><strong>{pending}</strong><small>تحتاج إلى إجراء</small></article>
        <article data-tone={expiring ? "warning" : "normal"}><span>تنتهي خلال 30 يومًا</span><strong>{expiring}</strong><small>تحتاج إلى تجديد</small></article>
        <article><span>مستندات سرية</span><strong>{confidential}</strong><small>وصول مقيّد</small></article>
      </section>

      <section className={styles.toolbar}>
        <label><span>بحث</span><input type="search" placeholder="اسم المستند، التصنيف أو الملف..." /></label>
        <label><span>الكيان</span><select defaultValue=""><option value="">جميع الكيانات</option>{Object.entries(entityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label><span>الحالة</span><select defaultValue=""><option value="">جميع الحالات</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label><span>التصنيف</span><select defaultValue=""><option value="">جميع التصنيفات</option>{[...new Set(documents.map((item) => item.category))].map((category) => <option key={category}>{category}</option>)}</select></label>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHead}><div><span>سجل الملفات</span><h2>آخر المستندات تحديثًا</h2></div><small>{documents.length} مستند</small></div>
        {documents.length ? (
          <div className={styles.tableWrap}><table>
            <thead><tr><th>المستند</th><th>التصنيف</th><th>مرتبط بـ</th><th>النسخة</th><th>الحالة</th><th>الحجم</th><th>آخر تحديث</th></tr></thead>
            <tbody>{documents.map((document) => {
              const href = document.entityType === "OPPORTUNITY" && document.entityId
                ? `/platform/opportunities/${document.entityId}`
                : document.entityType === "CONTRACT" && document.entityId
                  ? `/platform/contracts/${document.entityId}`
                  : document.entityType === "BUSINESS_PARTNER" && document.entityId
                    ? `/platform/partners/${document.entityId}`
                    : null;
              return <tr key={document.id}>
                <td><div className={styles.file}><i>{document.mimeType.includes("pdf") ? "PDF" : "ملف"}</i><div><strong>{document.title}</strong><small>{document.fileName} · بواسطة {document.uploadedBy.name}</small></div>{document.isConfidential && <b>سري</b>}</div></td>
                <td>{document.category}</td>
                <td>{href ? <Link href={href}>{entityLabels[document.entityType]}</Link> : entityLabels[document.entityType]}</td>
                <td>v{document.version}</td>
                <td><span className={styles.status} data-status={document.reviewStatus}>{statusLabels[document.reviewStatus]}</span></td>
                <td>{formatSize(document.sizeBytes)}</td>
                <td>{new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium" }).format(document.updatedAt)}</td>
              </tr>;
            })}</tbody>
          </table></div>
        ) : (
          <div className={styles.emptyState}><i>⌁</i><h3>مستودع المستندات جاهز</h3><p>لم تتم إضافة ملفات بعد. سيظهر هنا كل مستند مع نسخته وحالته والكيان المرتبط به.</p><span>يصبح الرفع متاحًا بعد ربط مزود التخزين الآمن.</span></div>
        )}
      </section>
    </main>
  );
}
