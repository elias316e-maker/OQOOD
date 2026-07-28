import { readDocumentFile } from "@/features/documents/storage";
import { hasPermission, Permissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const context = await requireCurrentWorkspace();
  const canRead =
    hasPermission(context, Permissions.workspace.read) ||
    hasPermission(context, Permissions.opportunities.read) ||
    hasPermission(context, Permissions.contracts.read) ||
    hasPermission(context, Permissions.procurement.read) ||
    hasPermission(context, Permissions.vendors.read);
  if (!canRead) return new Response("Forbidden", { status: 403 });

  const { documentId } = await params;
  const document = await prisma.document.findFirst({
    where: { id: documentId, workspaceId: context.workspace.id },
  });
  if (!document) return new Response("Not found", { status: 404 });

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
