import Link from "next/link";

import {
  Alert,
  WorkspaceHeader,
  EmptyState,
  FormSection,
  FormActions,
} from "@oqood/design-system";
import { notFound } from "next/navigation";

import {
  ContractAmendments,
  ContractExecution,
  ContractLifecycleActions,
  PartnerEvaluation,
} from "@/features/contract";
import { LinkedDocuments } from "@/features/documents/linked-documents";
import { PrismaOpportunityAuthorizationGateway } from "@/features/opportunity/authorization";
import {
  resolveOpportunityActionContext,
} from "@/features/opportunity/actions/helpers/resolve-opportunity-context";
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
  "contract.amendment_created": "إنشاء مسودة ملحق",
  "contract.amendment_submit": "إرسال ملحق للاعتماد",
  "contract.amendment_approve": "اعتماد ملحق وتطبيقه",
  "contract.amendment_reject": "رفض ملحق",
  "contract.milestone_created": "إضافة مرحلة تنفيذ",
  "contract.milestone_start": "بدء مرحلة تنفيذ",
  "contract.milestone_progress": "تحديث نسبة الإنجاز",
  "contract.milestone_submit": "تقديم تسليم",
  "contract.milestone_accept": "قبول تسليم",
  "contract.milestone_reject": "إعادة تسليم للمراجعة",
  "contract.milestone_claim": "تسجيل مطالبة مالية",
  "contract.milestone_pay": "تسجيل سداد مطالبة",
  "contract.partner_evaluated": "تقييم أداء المورد",
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
        businessPartner: { select: { id: true, nameAr: true, commercialRegister: true } },
        opportunity: { select: { id: true, number: true, title: true } },
        items: { orderBy: { lineNumber: "asc" } },
        amendments: { orderBy: { number: "desc" } },
        milestones: { orderBy: { number: "asc" } },
        partnerEvaluations: {
          include: { createdBy: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        },
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
  // Request time is required for current overdue milestone indicators.
  // eslint-disable-next-line react-hooks/purity
  const now = new Date();
  const overallProgress = contract.milestones.length
    ? Math.round(contract.milestones.reduce((sum, milestone) => sum + milestone.progress, 0) / contract.milestones.length)
    : 0;
  const claimedAmount = contract.milestones
    .filter((milestone) => milestone.paymentStatus === "CLAIMED")
    .reduce((sum, milestone) => sum + Number(milestone.amount), 0);
  const paidAmount = contract.milestones
    .filter((milestone) => milestone.paymentStatus === "PAID")
    .reduce((sum, milestone) => sum + Number(milestone.amount), 0);
  const overdueCount = contract.milestones.filter(
    (milestone) => milestone.dueDate && milestone.dueDate < now && milestone.status !== "ACCEPTED",
  ).length;

  return (
    <main className={styles.page}>
      <WorkspaceHeader
        className={styles.header}
        eyebrow={contract.number}
        title={contract.title}
        description={`عقد منشأ من العرض الفائز في المنافسة ${contract.opportunity.number}.`}
        actions={
          <Link
            className={styles.back}
            href="/platform/contracts"
          >
            العودة إلى العقود
          </Link>
        }
      />

      <nav className={styles.detailNav} aria-label="أقسام العقد">
        <a href="#overview">نظرة عامة</a>
        <a href="#items">بنود العقد</a>
        <a href="#execution">التنفيذ والمطالبات</a>
        <a href="#amendments">الملاحق</a>
        <a href="#activity">سجل النشاط</a>
        <a href="#documents">المستندات</a>
      </nav>

            <FormActions
        className={styles.actionBar}
        status={
          <>
            <strong>إجراءات دورة العقد</strong>
            <span>الحالة الحالية: {statusLabels[contract.status]}</span>
          </>
        }
      >
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
      </FormActions>

      {daysUntilEnd !== null && daysUntilEnd <= 30 && (
        <Alert
          className={styles.expiryAlert}
          data-tone={
            daysUntilEnd < 0
              ? "danger"
              : "warning"
          }
          tone={
            daysUntilEnd < 0
              ? "danger"
              : "warning"
          }
          role="alert"
          aria-live="polite"
        >
          {daysUntilEnd < 0
            ? `تجاوز العقد تاريخ انتهائه منذ ${Math.abs(daysUntilEnd)} يوم.`
            : `متبقي ${daysUntilEnd} يوم على تاريخ انتهاء العقد.`}
        </Alert>
      )}

      <section className={styles.executionKpis} id="overview">
        <article><span>نسبة الإنجاز</span><strong>{overallProgress}%</strong><i><b style={{ width: `${overallProgress}%` }} /></i></article>
        <article data-tone={overdueCount ? "danger" : "normal"}><span>مراحل متأخرة</span><strong>{overdueCount}</strong><small>من أصل {contract.milestones.length} مرحلة</small></article>
        <article><span>مطالبات قيد السداد</span><strong>{money(claimedAmount)}</strong><small>بانتظار الإجراء المالي</small></article>
        <article><span>المبالغ المسددة</span><strong>{money(paidAmount)}</strong><small>{Number(contract.totalAmount) ? Math.round(paidAmount / Number(contract.totalAmount) * 100) : 0}% من قيمة العقد</small></article>
      </section>

            <FormSection
        className={styles.panel}
        eyebrow="بيانات العقد"
        title="المعلومات الأساسية"
        description="بيانات المورد والقيمة والمواعيد والشروط التجارية للعقد."
      >
        <div className={styles.summary}>
          <article><span>الحالة</span><strong>{statusLabels[contract.status]}</strong></article>
          <article><span>المورد</span><strong><Link href={`/platform/partners/${contract.businessPartner.id}`}>{contract.businessPartner.nameAr}</Link></strong></article>
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
      </FormSection>

            <FormSection
        className={styles.panel}
        id="items"
        eyebrow="النطاق التجاري"
        title="بنود العقد"
        actions={
          <strong>
            {contract.items.length} بنود
          </strong>
        }
      >
        {contract.items.length === 0 ? (
          <EmptyState
            className={styles.empty}
            icon="▤"
            title="لا توجد بنود في العقد"
            description="لم تتم إضافة أي بنود إلى هذا العقد."
            role="status"
          />
        ) : (
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
        )}
      </FormSection>

            <FormSection
        className={styles.panel}
        id="activity"
        eyebrow="سجل التدقيق"
        title="سجل نشاط العقد"
      >
        {activity.length === 0 ? (
          <EmptyState
            className={styles.empty}
            icon="⌁"
            title="لا يوجد نشاط مسجل"
            description="لم تُسجل أي عمليات على هذا العقد حتى الآن."
            role="status"
          />
        ) : (
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
        )}
      </FormSection>

      {["ACTIVE", "SUSPENDED"].includes(contract.status) && (
                <FormSection
          className={styles.panel}
          id="amendments"
          eyebrow="إدارة التغييرات"
          title="ملاحق وتعديلات العقد"
        >
          <ContractAmendments
                      amendments={contract.amendments.map((amendment) => ({
                        id: amendment.id,
                        number: amendment.number,
                        title: amendment.title,
                        reason: amendment.reason,
                        status: amendment.status,
                        valueChange: amendment.valueChange.toString(),
                        resultingTotal: amendment.resultingTotal.toString(),
                        newEndDate: amendment.newEndDate?.toISOString() ?? null,
                        createdAt: amendment.createdAt.toISOString(),
                      }))}
                      canApprove={hasPermission(workspaceContext, Permissions.contracts.approve)}
                      canUpdate={hasPermission(workspaceContext, Permissions.contracts.update)}
                      contractId={contract.id}
                      currency={contract.currency}
                    />
        </FormSection>
      )}

      {contract.status === "ACTIVE" && (
                <FormSection
          className={styles.panel}
          id="execution"
          eyebrow="التنفيذ والمطالبات"
          title="تنفيذ العقد والتسليمات"
        >
          <ContractExecution
                      canApprove={hasPermission(workspaceContext, Permissions.contracts.approve)}
                      canUpdate={hasPermission(workspaceContext, Permissions.contracts.update)}
                      contractId={contract.id}
                      currency={contract.currency}
                      milestones={contract.milestones.map((milestone) => ({
                        id: milestone.id,
                        number: milestone.number,
                        title: milestone.title,
                        description: milestone.description,
                        dueDate: milestone.dueDate?.toISOString() ?? null,
                        amount: milestone.amount.toString(),
                        progress: milestone.progress,
                        status: milestone.status,
                        paymentStatus: milestone.paymentStatus,
                        rejectionReason: milestone.rejectionReason,
                      }))}
                    />
        </FormSection>
      )}

      {["ACTIVE", "COMPLETED"].includes(contract.status) && (
                <FormSection
          className={styles.panel}
          eyebrow="قياس الأداء"
          title="تقييم أداء المورد"
        >
          <PartnerEvaluation
                      canEvaluate={hasPermission(workspaceContext, Permissions.vendors.evaluate)}
                      contractId={contract.id}
                      evaluations={contract.partnerEvaluations.map((evaluation) => ({
                        id: evaluation.id,
                        overallScore: evaluation.overallScore.toString(),
                        timelinessScore: evaluation.timelinessScore,
                        qualityScore: evaluation.qualityScore,
                        responsivenessScore: evaluation.responsivenessScore,
                        financialScore: evaluation.financialScore,
                        notes: evaluation.notes,
                        createdAt: evaluation.createdAt.toISOString(),
                        createdBy: evaluation.createdBy.name,
                      }))}
                    />
        </FormSection>
      )}
      <LinkedDocuments
        canManage={hasPermission(workspaceContext, Permissions.contracts.update)}
        entityId={contract.id}
        entityType="CONTRACT"
        workspaceId={context.workspaceId}
      />
    </main>
  );
}
