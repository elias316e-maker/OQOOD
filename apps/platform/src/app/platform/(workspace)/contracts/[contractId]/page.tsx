import Link from "next/link";
import { notFound } from "next/navigation";

import { PrismaOpportunityAuthorizationGateway } from "@/features/opportunity/authorization";
import { resolveOpportunityActionContext } from "@/features/opportunity/actions";
import { Permissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

import styles from "../contracts.module.css";

type Props = { params: Promise<{ contractId: string }> };

export default async function ContractDetailsPage({ params }: Props) {
  const { contractId } = await params;
  const context = await resolveOpportunityActionContext();
  const authorization = new PrismaOpportunityAuthorizationGateway();
  const contract = await prisma.$transaction(async (transaction) => {
    await authorization.authorize(transaction, {
      workspaceId: context.workspaceId,
      actorUserId: context.actorUserId,
      permission: Permissions.contracts.read,
      requireWriteAccess: false,
    });
    return transaction.contract.findFirst({
      where: { id: contractId, workspaceId: context.workspaceId },
      include: {
        businessPartner: { select: { nameAr: true, commercialRegister: true } },
        opportunity: { select: { id: true, number: true, title: true } },
        items: { orderBy: { lineNumber: "asc" } },
      },
    });
  });
  if (!contract) notFound();

  const money = (value: unknown) =>
    new Intl.NumberFormat("ar-SA", { style: "currency", currency: contract.currency }).format(Number(value));

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div><span>{contract.number}</span><h1>{contract.title}</h1><p>مسودة منشأة من العرض الفائز في المنافسة {contract.opportunity.number}.</p></div>
        <Link className={styles.back} href="/platform/contracts">العودة إلى العقود</Link>
      </header>
      <section className={styles.panel}>
        <div className={styles.summary}>
          <article><span>الحالة</span><strong>{contract.status}</strong></article>
          <article><span>المورد</span><strong>{contract.businessPartner.nameAr}</strong></article>
          <article><span>القيمة الإجمالية</span><strong>{money(contract.totalAmount)}</strong></article>
          <article><span>المنافسة المصدر</span><strong><Link href={`/platform/opportunities/${contract.opportunity.id}`}>{contract.opportunity.number}</Link></strong></article>
          <article><span>قبل الضريبة</span><strong>{money(contract.subtotal)}</strong></article>
          <article><span>الضريبة</span><strong>{money(contract.taxAmount)}</strong></article>
          <article><span>مدة التسليم</span><strong>{contract.deliveryDays ? `${contract.deliveryDays} يوم` : "غير محددة"}</strong></article>
          <article><span>شروط الدفع</span><strong>{contract.paymentTerms ?? "غير محددة"}</strong></article>
        </div>
      </section>
      <section className={styles.panel}>
        <h2 className={styles.sectionTitle}>بنود العقد</h2>
        <table className={styles.table}>
          <thead><tr><th>#</th><th>الوصف</th><th>الكمية</th><th>سعر الوحدة</th><th>الإجمالي</th></tr></thead>
          <tbody>{contract.items.map((item) => (
            <tr key={item.id}><td>{item.lineNumber}</td><td>{item.description}</td><td>{item.quantity.toString()} {item.unit}</td><td>{money(item.unitPrice)}</td><td>{money(item.totalPrice)}</td></tr>
          ))}</tbody>
        </table>
      </section>
    </main>
  );
}
