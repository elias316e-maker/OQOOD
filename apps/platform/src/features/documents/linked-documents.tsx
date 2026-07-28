import {
  archiveDocumentAction,
  softDeleteDocumentAction,
} from "./actions";
import { DocumentVersionForm } from "./document-version-form";
import styles from "./linked-documents.module.css";
import { prisma } from "@/lib/prisma";

type EntityType = "OPPORTUNITY" | "CONTRACT" | "BUSINESS_PARTNER" | "PROJECT" | "PROCUREMENT_REQUEST";

const statusLabels: Record<string, string> = {
  DRAFT: "مسودة",
  PENDING_REVIEW: "بانتظار المراجعة",
  APPROVED: "معتمد",
  REJECTED: "مرفوض",
  EXPIRED: "منتهي",
  ARCHIVED: "مؤرشف",
};

export async function LinkedDocuments({
  workspaceId,
  entityType,
  entityId,
  canManage,
}: {
  workspaceId: string;
  entityType: EntityType;
  entityId: string;
  canManage: boolean;
}) {
  const documents = await prisma.document.findMany({
    where: { workspaceId, entityType, entityId, deletedAt: null },
    include: { uploadedBy: { select: { name: true } } },
    orderBy: [{ title: "asc" }, { version: "desc" }],
  });

  return <section className={styles.panel} id="documents">
    <header><div><span>ملفات مرتبطة</span><h2>المستندات والإصدارات</h2></div><a href="/platform/documents">فتح مركز المستندات</a></header>
    {documents.length ? <div className={styles.list}>{documents.map((document) => <article key={document.id} data-archived={document.reviewStatus === "ARCHIVED"}>
      <div className={styles.icon}>{document.mimeType.includes("pdf") ? "PDF" : "ملف"}</div>
      <div className={styles.info}><strong>{document.title}</strong><span>{document.category} · الإصدار {document.version} · {document.uploadedBy.name}</span></div>
      <span className={styles.status} data-status={document.reviewStatus}>{statusLabels[document.reviewStatus]}</span>
      <a className={styles.download} href={`/api/documents/${document.id}/download`}>تنزيل</a>
      {canManage && document.reviewStatus !== "ARCHIVED" && <DocumentVersionForm documentId={document.id} />}
      {canManage && document.reviewStatus !== "ARCHIVED" && <form action={archiveDocumentAction}><input name="documentId" type="hidden" value={document.id} /><button type="submit">أرشفة</button></form>}
      {canManage && <form action={softDeleteDocumentAction}><input name="documentId" type="hidden" value={document.id} /><button data-danger type="submit">حذف آمن</button></form>}
    </article>)}</div> : <p className={styles.empty}>لا توجد مستندات مرتبطة بهذا السجل بعد.</p>}
  </section>;
}
