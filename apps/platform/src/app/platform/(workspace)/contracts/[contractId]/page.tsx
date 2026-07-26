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
  "contract.suspend": "إيقاف العقد مؤقتاً",
  "contract.resume": "استئناف العقد",
  "contract.complete": "إكمال العقد",
  "contract.terminate": "إنهاء العقد",
  "contract.draft_updated": "تحديث بيانات مسودة العقد",
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
  const daysUntilEnd = contract.endDate
    ? Math.ceil(
        // The server request time is intentionally used for the expiry warning.
        // eslint-disable-next-line react-hooks/purity
        (contract.endDate.getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      )
    : null;

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
        <div className={styles.actionGroup}>
          {contract.status === "DRAFT" &&
            hasPermission(workspaceContext, Permissions.contracts.update) && (
              <Link className={styles.editLink} href={`/platform/contracts/${contract.id}/edit`}>تحرير المسودة</Link>
            )}
          <ContractLifecycleActions
            canApprove={hasPermission(workspaceContext, Permissions.contracts.approve)}
            canSign={hasPermission(workspaceContext, Permissions.contracts.sign)}
            canUpdate={hasPermission(workspaceContext, Permissions.contracts.update)}
            contractId={contract.id}
            status={contract.status}
          />
        </div>
      </section>

      {daysUntilEnd !== null && daysUntilEnd <= 30 && (
        <div
          className={styles.expiryAlert}
          data-tone={daysUntilEnd < 0 ? "danger" : "warning"}
          role="alert"
        >
          {daysUntilEnd < 0
            ? `تجاوز العقد تاريخ انتهائه منذ ${Math.abs(daysUntilEnd)} يوم.`
            : `متبقي ${daysUntilEnd} يوم على تاريخ انتهاء العقد.`}
        </div>
      )}

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
          <article><span>تاريخ البدء</span><strong>{contract.startDate ? new Intl.DateTimeFormat("ar-SA").format(contract.startDate) : "غير محدد"}</strong></article>
          <article><span>تاريخ الانتهاء</span><strong>{contract.endDate ? new Intl.DateTimeFormat("ar-SA").format(contract.endDate) : "غير محدد"}</strong></article>
          {contract.suspensionReason && <article><span>سبب آخر إيقاف</span><strong>{contract.suspensionReason}</strong></article>}
          {contract.terminationReason && <article><span>سبب الإنهاء</span><strong>{contract.terminationReason}</strong></article>}
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
