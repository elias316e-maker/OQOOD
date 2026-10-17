import Link from "next/link";
import {
  notFound,
  redirect,
} from "next/navigation";

import {
  WorkspaceHeader,
} from "@oqood/design-system";

import {
  ContractEditForm,
} from "@/features/contract";

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

import styles from "../../contracts.module.css";

type ContractEditPageProps = {
  params: Promise<{
    contractId: string;
  }>;
};

export default async function ContractEditPage({
  params,
}: ContractEditPageProps) {
  const { contractId } = await params;

  const context =
    await requireCurrentWorkspace();

  if (
    !hasPermission(
      context,
      Permissions.contracts.update,
    )
  ) {
    redirect(
      `/platform/contracts/${contractId}`,
    );
  }

  const contract =
    await prisma.contract.findFirst({
      where: {
        id: contractId,
        workspaceId: context.workspace.id,
      },
    });

  if (!contract) {
    notFound();
  }

  if (contract.status !== "DRAFT") {
    redirect(
      `/platform/contracts/${contract.id}`,
    );
  }

  return (
    <main className={styles.page}>
      <WorkspaceHeader
        className={styles.header}
        eyebrow={contract.number}
        title="تحرير مسودة العقد"
        description="حدد بيانات العقد ومدته وشروطه التجارية قبل إرساله للاعتماد."
        badge="مسودة"
        actions={
          <Link
            className={styles.back}
            href={`/platform/contracts/${contract.id}`}
          >
            العودة إلى العقد
          </Link>
        }
      />

      <ContractEditForm
        contract={{
          id: contract.id,
          title: contract.title,
          description:
            contract.description,
          paymentTerms:
            contract.paymentTerms,
          deliveryDays:
            contract.deliveryDays,
          startDate:
            contract.startDate
              ?.toISOString()
              .slice(0, 10) ?? "",
          endDate:
            contract.endDate
              ?.toISOString()
              .slice(0, 10) ?? "",
        }}
      />
    </main>
  );
}
