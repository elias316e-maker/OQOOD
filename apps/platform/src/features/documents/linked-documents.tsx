import {
  EmptyState,
  FormSection,
} from "@oqood/design-system";

import {
  requireAuthenticatedUser,
} from "@/features/workspace/guards";

import {
  hasPermission,
  Permissions,
} from "@/lib/permissions";

import {
  prisma,
} from "@/lib/prisma";

import {
  requireCurrentWorkspace,
} from "@/lib/workspace-context";

import {
  archiveDocumentAction,
  softDeleteDocumentAction,
} from "./actions";

import {
  DocumentVersionForm,
} from "./document-version-form";

import styles from "./linked-documents.module.css";

type EntityType =
  | "OPPORTUNITY"
  | "CONTRACT"
  | "BUSINESS_PARTNER"
  | "PROJECT"
  | "PROCUREMENT_REQUEST";

const statusLabels: Record<
  string,
  string
> = {
  DRAFT: "مسودة",
  PENDING_REVIEW:
    "بانتظار المراجعة",
  APPROVED: "معتمد",
  REJECTED: "مرفوض",
  EXPIRED: "منتهي",
  ARCHIVED: "مؤرشف",
};

type LinkedDocumentsProps = {
  workspaceId: string;
  entityType: EntityType;
  entityId: string;
  canManage: boolean;
};

export async function LinkedDocuments({
  workspaceId,
  entityType,
  entityId,
  canManage,
}: LinkedDocumentsProps) {
  const [context, user] =
    await Promise.all([
      requireCurrentWorkspace(),
      requireAuthenticatedUser(),
    ]);

  if (
    context.workspace.id !==
    workspaceId
  ) {
    return null;
  }

  const canReviewConfidential =
    hasPermission(
      context,
      Permissions.workspace.manageRoles,
    ) ||
    hasPermission(
      context,
      Permissions.contracts.approve,
    ) ||
    hasPermission(
      context,
      Permissions.procurement.approve,
    ) ||
    hasPermission(
      context,
      Permissions.opportunities.evaluate,
    );

  const documents =
    await prisma.document.findMany({
      where: {
        workspaceId,
        entityType,
        entityId,
        deletedAt: null,
        ...(canReviewConfidential
          ? {}
          : {
              OR: [
                {
                  isConfidential: false,
                },
                {
                  uploadedById:
                    user.id,
                },
              ],
            }),
      },
      include: {
        uploadedBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [
        {
          title: "asc",
        },
        {
          version: "desc",
        },
      ],
    });

  return (
    <FormSection
      className={styles.panel}
      eyebrow="ملفات مرتبطة"
      title="المستندات والإصدارات"
      description="المستندات والإصدارات المرتبطة بهذا السجل."
      id="documents"
      actions={
        <a href="/platform/documents">
          فتح مركز المستندات
        </a>
      }
    >
      {documents.length > 0 ? (
        <div className={styles.list}>
          {documents.map(
            (document) => (
              <article
                data-archived={
                  document.reviewStatus ===
                  "ARCHIVED"
                }
                key={document.id}
              >
                <div
                  className={
                    styles.icon
                  }
                >
                  {document.mimeType.includes(
                    "pdf",
                  )
                    ? "PDF"
                    : "ملف"}
                </div>

                <div
                  className={
                    styles.info
                  }
                >
                  <strong>
                    {document.title}
                  </strong>

                  <span>
                    {document.category}
                    {" · "}
                    الإصدار{" "}
                    {document.version}
                    {" · "}
                    {
                      document
                        .uploadedBy.name
                    }
                  </span>
                </div>

                <span
                  className={
                    styles.status
                  }
                  data-status={
                    document.reviewStatus
                  }
                >
                  {
                    statusLabels[
                      document.reviewStatus
                    ]
                  }
                </span>

                <a
                  className={
                    styles.download
                  }
                  href={`/api/documents/${document.id}/download`}
                >
                  تنزيل
                </a>

                {canManage &&
                document.reviewStatus !==
                  "ARCHIVED" ? (
                  <DocumentVersionForm
                    documentId={
                      document.id
                    }
                  />
                ) : null}

                {canManage &&
                document.reviewStatus !==
                  "ARCHIVED" ? (
                  <form
                    action={
                      archiveDocumentAction
                    }
                  >
                    <input
                      name="documentId"
                      type="hidden"
                      value={
                        document.id
                      }
                    />

                    <button type="submit">
                      أرشفة
                    </button>
                  </form>
                ) : null}

                {canManage ? (
                  <form
                    action={
                      softDeleteDocumentAction
                    }
                  >
                    <input
                      name="documentId"
                      type="hidden"
                      value={
                        document.id
                      }
                    />

                    <button
                      data-danger
                      type="submit"
                    >
                      حذف آمن
                    </button>
                  </form>
                ) : null}
              </article>
            ),
          )}
        </div>
      ) : (
        <EmptyState
          className={styles.empty}
          icon="⌁"
          title="لا توجد مستندات مرتبطة"
          description="لا توجد مستندات مرتبطة بهذا السجل حتى الآن."
          role="status"
        />
      )}
    </FormSection>
  );
}
