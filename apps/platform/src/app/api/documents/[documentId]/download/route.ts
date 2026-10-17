import { readDocumentFile } from "@/features/documents/storage";
import { requireAuthenticatedUser } from "@/features/workspace/guards";
import { hasPermission, Permissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

function canReadDocumentEntity(
  context: Awaited<ReturnType<typeof requireCurrentWorkspace>>,
  entityType: string,
) {
  if (entityType === "WORKSPACE" || entityType === "PROJECT") {
    return hasPermission(context, Permissions.workspace.read);
  }
  if (entityType === "PROCUREMENT_REQUEST") {
    return hasPermission(context, Permissions.procurement.read);
  }
  if (entityType === "OPPORTUNITY" || entityType === "OFFER") {
    return hasPermission(context, Permissions.opportunities.read);
  }
  if (entityType === "CONTRACT") {
    return hasPermission(context, Permissions.contracts.read);
  }
  if (entityType === "BUSINESS_PARTNER") {
    return hasPermission(context, Permissions.vendors.read);
  }
  return false;
}

function canReadConfidentialDocument(
  context: Awaited<ReturnType<typeof requireCurrentWorkspace>>,
) {
  return (
    hasPermission(context, Permissions.workspace.manageRoles) ||
    hasPermission(context, Permissions.contracts.approve) ||
    hasPermission(context, Permissions.procurement.approve) ||
    hasPermission(context, Permissions.opportunities.evaluate)
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const [context, user] = await Promise.all([
    requireCurrentWorkspace(),
    requireAuthenticatedUser(),
  ]);

  const { documentId } = await params;
  const document = await prisma.document.findFirst({
    where: { id: documentId, workspaceId: context.workspace.id, deletedAt: null },
  });
  if (!document) return new Response("Not found", { status: 404 });
  if (!canReadDocumentEntity(context, document.entityType)) {
    return new Response("Forbidden", { status: 403 });
  }
  if (
    document.isConfidential &&
    document.uploadedById !== user.id &&
    !canReadConfidentialDocument(context)
  ) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const body = await readDocumentFile(document.storageKey);
    const safeAsciiName = document.fileName.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");
    return new Response(new Uint8Array(body), {
      headers: {
        "Content-Type": document.mimeType,
        "Content-Length": String(body.byteLength),
        "Content-Disposition": `attachment; filename="${safeAsciiName}"; filename*=UTF-8''${encodeURIComponent(document.fileName)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Stored file is unavailable", { status: 410 });
  }
}
