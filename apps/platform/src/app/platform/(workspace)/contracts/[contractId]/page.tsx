import Link from "next/link";
import { notFound } from "next/navigation";

import { ContractLifecycleActions } from "@/features/contract";
import { PrismaOpportunityAuthorizationGateway } from "@/features/opportunity/authorization";
import { resolveOpportunityActionContext } from "@/features/opportunity/actions";
import { hasPermission, Permissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

import styles from "../contracts.module.css";

type Props = { params: Promise<{ contractId: string }> };

const statusLabels = {
  DRAFT: "مسودة",
  PENDING_APPROVAL: "بانتظار الاعتماد",
  APPROVED: "معتمد",
  SENT_FOR_SIGNATURE: "مرسل للتوقيع",
  ACTIVE: "ساري",
  SUSPENDED: "موقوف",
  COMPLETED: "مكتمل",
  TERMINATED: "منتهي",
  CANCELLED: "ملغي",
  ARCHIVED: "مؤرشف",
} as const;

const activityLabels: Record<string, string> = {
  "contract.created_from_award": "إنشاء مسودة العقد من العرض الفائز",
  "contract.submit_for_approval": "إرسال العقد للاعتماد",
  "contract.approve": "اعتماد العقد",
  "contract.send_for_signature": "إرسال العقد للتوقيع",
  "contract.activate": "توثيق التوقيع وتفعيل العقد",
};

export default async function ContractDetailsPage({ params }: Props) {
  const { contractId } = await params;
  const [context, workspaceContext] = await Promise.all([
    resolveOpportunityActionContext(),
    requireCurrentWorkspace(),
  ]);
  const authorization = new PrismaOpportunityAuthorizationGateway();
  const result = await prisma.$transaction(async (transaction) => {
    await authorization.authorize(transaction, {
      workspaceId: context.workspaceId,
      actorUserId: context.actorUserId,
      permission: Permissions.contracts.read,
      requireWriteAccess: false,
    });
    const contract = await transaction.contract.findFirst({
      where: { id: contractId, workspaceId: context.workspaceId },
      include: {
        businessPartner: { select: { nameAr: true, commercialRegister: true } },
        opportunity: { select: { id: true, number: true, title: true } },
        items: { orderBy: { lineNumber: "asc" } },
      },
    });
    const activity = contract
      ? await transaction.auditLog.findMany({
          where: {
            workspaceId: context.workspaceId,
            entityType: "Contract",
            entityId: contract.id,
          },
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        })
      : [];
    return { contract, activity };
  });
  const { contract, activity } = result;
  if (!contract) notFound();

  const money = (value: unknown) =>
    new Intl.NumberFormat("ar-SA", {
      style: "currency",
      currency: contract.currency,
    }).format(Number(value));

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <span>{contract.number}</span>
          <h1>{contract.title}</h1>
          <p>عقد منشأ من العرض الفائز في المنافسة {contract.opportunity.number}.</p>
        </div>
        <Link className={styles.back} href="/platform/contracts">العودة إلى العقود</Link>
      </header>

      <section className={styles.actionBar}>
        <div>
          <strong>إجراءات دورة العقد</strong>
          <span>الحالة الحالية: {statusLabels[contract.status]}</span>
        </div>
        <ContractLifecycleActions
          canApprove={hasPermission(workspaceContext, Permissions.contracts.approve)}
          canSign={hasPermission(workspaceContext, Permissions.contracts.sign)}
          canUpdate={hasPermission(workspaceContext, Permissions.contracts.update)}
          contractId={contract.id}
          status={contract.status}
        />
      </section>

      <section className={styles.panel}>
        <div className={styles.summary}>
          <article><span>الحالة</span><strong>{statusLabels[contract.status]}</strong></article>
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
            <tr key={item.id}>
              <td>{item.lineNumber}</td>
              <td>{item.description}</td>
              <td>{item.quantity.toString()} {item.unit}</td>
              <td>{money(item.unitPrice)}</td>
              <td>{money(item.totalPrice)}</td>
            </tr>
          ))}</tbody>
        </table>
      </section>

      <section className={styles.panel}>
        <h2 className={styles.sectionTitle}>سجل نشاط العقد</h2>
        <div className={styles.timeline}>
          {activity.map((entry) => (
            <article key={entry.id}>
              <span aria-hidden="true" />
              <div>
                <strong>{activityLabels[entry.action] ?? entry.action}</strong>
                <p>
                  {entry.user?.name ?? "النظام"} ·{" "}
                  {new Intl.DateTimeFormat("ar-SA", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(entry.createdAt)}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
