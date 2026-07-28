"use server";

import { revalidatePath } from "next/cache";

import { requireAuthenticatedUser } from "@/features/workspace/guards";
import { hasPermission, Permissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

import { removeDocumentFile, storeDocumentFile } from "./storage";

export type DocumentFormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const allowedTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);
const entityTypes = new Set([
  "WORKSPACE",
  "PROCUREMENT_REQUEST",
  "OPPORTUNITY",
  "OFFER",
  "CONTRACT",
  "BUSINESS_PARTNER",
  "PROJECT",
]);
const maxFileSize = 10 * 1024 * 1024;

function text(data: FormData, key: string) {
  const value = data.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function canUpload(context: Awaited<ReturnType<typeof requireCurrentWorkspace>>) {
  return (
    hasPermission(context, Permissions.workspace.update) ||
    hasPermission(context, Permissions.opportunities.create) ||
    hasPermission(context, Permissions.opportunities.update) ||
    hasPermission(context, Permissions.contracts.create) ||
    hasPermission(context, Permissions.contracts.update) ||
    hasPermission(context, Permissions.procurement.create) ||
    hasPermission(context, Permissions.procurement.update) ||
    hasPermission(context, Permissions.vendors.create) ||
    hasPermission(context, Permissions.vendors.update)
  );
}

function canReview(context: Awaited<ReturnType<typeof requireCurrentWorkspace>>) {
  return (
    hasPermission(context, Permissions.workspace.manageRoles) ||
    hasPermission(context, Permissions.contracts.approve) ||
    hasPermission(context, Permissions.procurement.approve) ||
    hasPermission(context, Permissions.opportunities.evaluate)
  );
}

function revalidateDocumentPaths(entityType?: string, entityId?: string | null) {
  revalidatePath("/platform/documents");
  if (!entityId) return;
  if (entityType === "OPPORTUNITY") revalidatePath(`/platform/opportunities/${entityId}`);
  if (entityType === "CONTRACT") revalidatePath(`/platform/contracts/${entityId}`);
  if (entityType === "BUSINESS_PARTNER") revalidatePath(`/platform/partners/${entityId}`);
  if (entityType === "PROCUREMENT_REQUEST") revalidatePath(`/platform/procurement/${entityId}`);
}

async function linkedEntityExists(
  workspaceId: string,
  entityType: string,
  entityId: string | null,
) {
  if (entityType === "WORKSPACE") return entityId === null;
  if (!entityId) return false;
  switch (entityType) {
    case "PROCUREMENT_REQUEST":
      return Boolean(await prisma.procurementRequest.findFirst({ where: { id: entityId, workspaceId }, select: { id: true } }));
    case "OPPORTUNITY":
      return Boolean(await prisma.opportunity.findFirst({ where: { id: entityId, workspaceId }, select: { id: true } }));
    case "OFFER":
      return Boolean(await prisma.offer.findFirst({ where: { id: entityId, opportunity: { workspaceId } }, select: { id: true } }));
    case "CONTRACT":
      return Boolean(await prisma.contract.findFirst({ where: { id: entityId, workspaceId }, select: { id: true } }));
    case "BUSINESS_PARTNER":
      return Boolean(await prisma.businessPartner.findFirst({ where: { id: entityId, workspaceId }, select: { id: true } }));
    case "PROJECT":
      return Boolean(await prisma.project.findFirst({ where: { id: entityId, workspaceId }, select: { id: true } }));
    default:
      return false;
  }
}

export async function uploadDocumentAction(
  _state: DocumentFormState,
  formData: FormData,
): Promise<DocumentFormState> {
  let storedKey: string | undefined;
  try {
    const [context, user] = await Promise.all([
      requireCurrentWorkspace(),
      requireAuthenticatedUser(),
    ]);
    if (!canUpload(context)) throw new Error("لا تملك صلاحية رفع المستندات.");

    const file = formData.get("file");
    const title = text(formData, "title");
    const category = text(formData, "category");
    const entityType = text(formData, "entityType");
    const entityId = text(formData, "entityId") || null;
    const expiresAt = text(formData, "expiresAt");

    if (!(file instanceof File) || file.size === 0) throw new Error("اختر ملفًا صالحًا.");
    if (file.size > maxFileSize) throw new Error("الحد الأعلى لحجم الملف هو 10 ميجابايت.");
    if (!allowedTypes.has(file.type)) throw new Error("نوع الملف غير مدعوم.");
    if (title.length < 2 || title.length > 180) throw new Error("عنوان المستند يجب أن يكون بين حرفين و180 حرفًا.");
    if (category.length < 2 || category.length > 80) throw new Error("أدخل تصنيفًا صالحًا.");
    if (!entityTypes.has(entityType)) throw new Error("نوع الارتباط غير صالح.");
    if (entityType !== "WORKSPACE" && !entityId) throw new Error("اختر السجل المرتبط بالمستند.");
    if (!(await linkedEntityExists(context.workspace.id, entityType, entityId))) {
      throw new Error("السجل المرتبط غير موجود في مساحة العمل الحالية.");
    }

    storedKey = await storeDocumentFile(context.workspace.id, file);
    await prisma.$transaction(async (transaction) => {
      const document = await transaction.document.create({
        data: {
          workspaceId: context.workspace.id,
          entityType: entityType as "WORKSPACE",
          entityId,
          title,
          category,
          fileName: file.name.slice(0, 240),
          mimeType: file.type,
          storageKey: storedKey!,
          sizeBytes: file.size,
          reviewStatus: "PENDING_REVIEW",
          isConfidential: text(formData, "isConfidential") === "on",
          expiresAt: expiresAt ? new Date(`${expiresAt}T00:00:00Z`) : null,
          notes: text(formData, "notes") || null,
          uploadedById: user.id,
        },
      });
      await transaction.auditLog.create({
        data: {
          workspaceId: context.workspace.id,
          userId: user.id,
          action: "document.uploaded",
          entityType: "Document",
          entityId: document.id,
          metadata: { title, category, linkedEntityType: entityType, linkedEntityId: entityId, size: file.size },
        },
      });
    });
    revalidateDocumentPaths(entityType, entityId);
    return { status: "success", message: "تم رفع المستند وإرساله للمراجعة." };
  } catch (error) {
    if (storedKey) await removeDocumentFile(storedKey);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "تعذر رفع المستند.",
    };
  }
}

export async function reviewDocumentAction(formData: FormData) {
  const [context, user] = await Promise.all([
    requireCurrentWorkspace(),
    requireAuthenticatedUser(),
  ]);
  if (!canReview(context)) throw new Error("لا تملك صلاحية مراجعة المستندات.");

  const documentId = text(formData, "documentId");
  const decision = text(formData, "decision");
  if (decision !== "APPROVED" && decision !== "REJECTED") throw new Error("قرار المراجعة غير صالح.");

  const reviewedDocument = await prisma.$transaction(async (transaction) => {
    const document = await transaction.document.findFirst({
      where: { id: documentId, workspaceId: context.workspace.id },
      select: { id: true, entityType: true, entityId: true },
    });
    if (!document) throw new Error("المستند غير موجود.");
    await transaction.document.update({
      where: { id: document.id },
      data: {
        reviewStatus: decision,
        reviewedById: user.id,
        reviewedAt: new Date(),
        reviewNotes: text(formData, "reviewNotes") || null,
      },
    });
    await transaction.auditLog.create({
      data: {
        workspaceId: context.workspace.id,
        userId: user.id,
        action: decision === "APPROVED" ? "document.approved" : "document.rejected",
        entityType: "Document",
        entityId: document.id,
      },
    });
    return document;
  });
  revalidateDocumentPaths(reviewedDocument.entityType, reviewedDocument.entityId);
}

export async function createDocumentVersionAction(
  _state: DocumentFormState,
  formData: FormData,
): Promise<DocumentFormState> {
  let storedKey: string | undefined;
  try {
    const [context, user] = await Promise.all([
      requireCurrentWorkspace(),
      requireAuthenticatedUser(),
    ]);
    if (!canUpload(context)) throw new Error("لا تملك صلاحية إصدار نسخة جديدة.");
    const file = formData.get("file");
    const documentId = text(formData, "documentId");
    if (!(file instanceof File) || file.size === 0) throw new Error("اختر ملف الإصدار الجديد.");
    if (file.size > maxFileSize) throw new Error("الحد الأعلى لحجم الملف هو 10 ميجابايت.");
    if (!allowedTypes.has(file.type)) throw new Error("نوع الملف غير مدعوم.");

    const current = await prisma.document.findFirst({
      where: { id: documentId, workspaceId: context.workspace.id, deletedAt: null },
    });
    if (!current) throw new Error("المستند غير موجود.");
    storedKey = await storeDocumentFile(context.workspace.id, file);

    await prisma.$transaction(async (transaction) => {
      const next = await transaction.document.create({
        data: {
          workspaceId: current.workspaceId,
          entityType: current.entityType,
          entityId: current.entityId,
          title: current.title,
          category: current.category,
          fileName: file.name.slice(0, 240),
          mimeType: file.type,
          storageKey: storedKey!,
          sizeBytes: file.size,
          version: current.version + 1,
          reviewStatus: "PENDING_REVIEW",
          isConfidential: current.isConfidential,
          expiresAt: current.expiresAt,
          notes: text(formData, "notes") || current.notes,
          uploadedById: user.id,
          previousVersionId: current.id,
        },
      });
      await transaction.document.update({
        where: { id: current.id },
        data: { reviewStatus: "ARCHIVED" },
      });
      await transaction.auditLog.create({
        data: {
          workspaceId: context.workspace.id,
          userId: user.id,
          action: "document.version_created",
          entityType: "Document",
          entityId: next.id,
          metadata: { previousVersionId: current.id, version: next.version },
        },
      });
    });
    revalidateDocumentPaths(current.entityType, current.entityId);
    return { status: "success", message: `تم إنشاء الإصدار ${current.version + 1}.` };
  } catch (error) {
    if (storedKey) await removeDocumentFile(storedKey);
    return { status: "error", message: error instanceof Error ? error.message : "تعذر إنشاء الإصدار." };
  }
}

export async function archiveDocumentAction(formData: FormData) {
  const [context, user] = await Promise.all([
    requireCurrentWorkspace(),
    requireAuthenticatedUser(),
  ]);
  if (!canUpload(context)) throw new Error("لا تملك صلاحية أرشفة المستند.");
  const documentId = text(formData, "documentId");
  const document = await prisma.document.findFirst({
    where: { id: documentId, workspaceId: context.workspace.id, deletedAt: null },
    select: { id: true, entityType: true, entityId: true },
  });
  if (!document) throw new Error("المستند غير موجود.");
  await prisma.$transaction([
    prisma.document.update({ where: { id: document.id }, data: { reviewStatus: "ARCHIVED" } }),
    prisma.auditLog.create({
      data: {
        workspaceId: context.workspace.id,
        userId: user.id,
        action: "document.archived",
        entityType: "Document",
        entityId: document.id,
      },
    }),
  ]);
  revalidateDocumentPaths(document.entityType, document.entityId);
}

export async function softDeleteDocumentAction(formData: FormData) {
  const [context, user] = await Promise.all([
    requireCurrentWorkspace(),
    requireAuthenticatedUser(),
  ]);
  if (!canUpload(context)) throw new Error("لا تملك صلاحية حذف المستند.");
  const documentId = text(formData, "documentId");
  const reason = text(formData, "reason");
  const document = await prisma.document.findFirst({
    where: { id: documentId, workspaceId: context.workspace.id, deletedAt: null },
    select: { id: true, entityType: true, entityId: true },
  });
  if (!document) throw new Error("المستند غير موجود.");
  await prisma.$transaction([
    prisma.document.update({
      where: { id: document.id },
      data: {
        reviewStatus: "ARCHIVED",
        deletedAt: new Date(),
        deletedById: user.id,
        deletionReason: reason || "حذف من مركز المستندات",
      },
    }),
    prisma.auditLog.create({
      data: {
        workspaceId: context.workspace.id,
        userId: user.id,
        action: "document.soft_deleted",
        entityType: "Document",
        entityId: document.id,
        metadata: { reason: reason || null },
      },
    }),
  ]);
  revalidateDocumentPaths(document.entityType, document.entityId);
}
