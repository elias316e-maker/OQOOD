import Link from "next/link";

import {
  ProcurementCreateForm,
} from "@/features/procurement/components";

import {
  hasPermission,
  Permissions,
} from "@/lib/permissions";

import {
  requireCurrentWorkspace,
} from "@/lib/workspace-context";
import { prisma } from "@/lib/prisma";

import {
  EmptyState,
} from "@oqood/design-system";

function createDraftNumber(): string {
  const date = new Date();
  const datePart = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");
  const randomPart = Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase();

  return `PR-${datePart}-${randomPart}`;
}

export default async function NewProcurementRequestPage() {
  const workspaceContext =
    await requireCurrentWorkspace();

  const canCreate = hasPermission(
    workspaceContext,
    Permissions.procurement.create,
  );

  if (!canCreate) {
    return (
      <main className="platformContent">
        <section className="dashboardPanel">
                    <EmptyState
            tone="warning"
            icon="!"
            title="ليس لديك صلاحية إنشاء طلب مشتريات"
            description="تواصل مع مسؤول مساحة العمل للحصول على الصلاحية المطلوبة."
            role="alert"
            aria-live="polite"
            actions={
                <Link
                              className="primaryButton compactButton"
                              href="/platform/procurement"
                            >
                              العودة إلى طلبات المشتريات
                            </Link>
            }
          />
        </section>
      </main>
    );
  }
  const projects = await prisma.project.findMany({
    where: { workspaceId: workspaceContext.workspace.id, status: { in: ["PLANNED", "ACTIVE"] } },
    select: { id: true, code: true, nameAr: true },
    orderBy: { nameAr: "asc" },
  });

  return (
    <ProcurementCreateForm
      defaultCurrency={
        workspaceContext.workspace.defaultCurrency
      }
      draftNumber={createDraftNumber()}
      projects={projects.map((project) => ({ id: project.id, label: `${project.code} — ${project.nameAr}` }))}
    />
  );
}
