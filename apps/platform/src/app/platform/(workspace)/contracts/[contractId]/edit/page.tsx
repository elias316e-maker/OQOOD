import { notFound, redirect } from "next/navigation";

import { ContractEditForm } from "@/features/contract";
import { hasPermission, Permissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

import styles from "../../contracts.module.css";

export default async function ContractEditPage({
  params,
}: {
  params: Promise<{ contractId: string }>;
}) {
  const { contractId } = await params;
  const context = await requireCurrentWorkspace();
  if (!hasPermission(context, Permissions.contracts.update)) {
    redirect(`/platform/contracts/${contractId}`);
  }
  const contract = await prisma.contract.findFirst({
    where: { id: contractId, workspaceId: context.workspace.id },
  });
  if (!contract) notFound();
  if (contract.status !== "DRAFT") redirect(`/platform/contracts/${contract.id}`);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div><span>{contract.number}</span><h1>تحرير مسودة العقد</h1><p>حدد مدة العقد وشروطه قبل إرساله للاعتماد.</p></div>
      </header>
      <ContractEditForm contract={{
        id: contract.id,
        title: contract.title,
        description: contract.description,
        paymentTerms: contract.paymentTerms,
        deliveryDays: contract.deliveryDays,
        startDate: contract.startDate?.toISOString().slice(0, 10) ?? "",
        endDate: contract.endDate?.toISOString().slice(0, 10) ?? "",
      }} />
    </main>
  );
}
