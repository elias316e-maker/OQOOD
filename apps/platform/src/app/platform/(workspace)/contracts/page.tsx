import Link from "next/link";

import { PrismaOpportunityAuthorizationGateway } from "@/features/opportunity/authorization";
import { resolveOpportunityActionContext } from "@/features/opportunity/actions";
import { Permissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

import styles from "./contracts.module.css";

export default async function ContractsPage() {
  const context = await resolveOpportunityActionContext();
  const authorization = new PrismaOpportunityAuthorizationGateway();
  const contracts = await prisma.$transaction(async (transaction) => {
    await authorization.authorize(transaction, {
      workspaceId: context.workspaceId,
      actorUserId: context.actorUserId,
      permission: Permissions.contracts.read,
      requireWriteAccess: false,
    });
    return transaction.contract.findMany({
      where: { workspaceId: context.workspaceId },
      include: { businessPartner: { select: { nameAr: true } } },
      orderBy: { createdAt: "desc" },
    });
  });

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div><span>إدارة دورة التعاقد</span><h1>العقود</h1><p>العقود الناتجة من المنافسات والعروض الفائزة.</p></div>
      </header>
      <section className={styles.panel}>
        {contracts.length === 0 ? (
          <p className={styles.empty}>لا توجد عقود بعد. ابدأ بترسية منافسة ثم أنشئ مسودة العقد.</p>
        ) : (
          <table className={styles.table}>
            <thead><tr><th>رقم العقد</th><th>العنوان</th><th>المورد</th><th>الحالة</th><th>القيمة</th><th>تاريخ الإنشاء</th></tr></thead>
            <tbody>{contracts.map((contract) => (
              <tr key={contract.id}>
                <td><Link href={`/platform/contracts/${contract.id}`}>{contract.number}</Link></td>
                <td>{contract.title}</td>
                <td>{contract.businessPartner.nameAr}</td>
                <td><span className={styles.status}>{contract.status}</span></td>
                <td>{new Intl.NumberFormat("ar-SA", { style: "currency", currency: contract.currency }).format(Number(contract.totalAmount))}</td>
                <td>{new Intl.DateTimeFormat("ar-SA").format(contract.createdAt)}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </section>
    </main>
  );
}
