"use client";

import Link from "next/link";
import { Alert, Badge, Button, DashboardPanel, EmptyState, FormSection, Input, Select, Textarea, WorkspaceHeader } from "@oqood/design-system";
import {
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";

import {
  evaluateOpportunityOfferAction,
  saveOpportunityOfferAction,
  type OpportunityOfferData,
} from "../actions/manage-opportunity-offers";
import { createContractFromAwardAction } from "../actions/create-contract-from-award";

import styles from "./opportunity-offers-form.module.css";

export function OpportunityOffersForm({
  data,
  canEvaluate,
  canAward,
  canCreateContract,
}: {
  data: OpportunityOfferData;
  canEvaluate: boolean;
  canAward: boolean;
  canCreateContract: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [partnerId, setPartnerId] = useState(
    data.partners[0]?.id ?? "",
  );
  const [prices, setPrices] = useState<Record<string, string>>(
    Object.fromEntries(data.items.map((item) => [item.id, ""])),
  );
  const [taxRate, setTaxRate] = useState("15");
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  const subtotal = useMemo(
    () =>
      data.items.reduce((sum, item) => {
        const price = Number(prices[item.id]);
        const quantity = Number(item.quantity);
        return Number.isFinite(price) &&
          Number.isFinite(quantity)
          ? sum + price * quantity
          : sum;
      }, 0),
    [data.items, prices],
  );
  const total = subtotal * (1 + Number(taxRate || 0) / 100);

  function money(value: string | number) {
    return new Intl.NumberFormat("ar-SA", {
      style: "currency",
      currency: data.opportunity.currency,
      maximumFractionDigits: 2,
    }).format(Number(value));
  }

  function submit(formData: FormData) {
    setFeedback(null);
    startTransition(async () => {
      const result = await saveOpportunityOfferAction({
        opportunityId: data.opportunity.id,
        businessPartnerId: partnerId,
        referenceNumber:
          String(formData.get("referenceNumber") ?? ""),
        taxRate,
        deliveryDays:
          String(formData.get("deliveryDays") ?? ""),
        validityDays:
          String(formData.get("validityDays") ?? ""),
        paymentTerms:
          String(formData.get("paymentTerms") ?? ""),
        technicalNotes:
          String(formData.get("technicalNotes") ?? ""),
        commercialNotes:
          String(formData.get("commercialNotes") ?? ""),
        items: data.items.map((item) => ({
          opportunityItemId: item.id,
          unitPrice: prices[item.id] ?? "",
        })),
      });

      setFeedback({
        tone: result.success ? "success" : "error",
        message: result.message ?? "تم حفظ العرض.",
      });
      if (result.success) {
        router.refresh();
      }
    });
  }

  function evaluate(
    offerId: string,
    decision:
      | "TECHNICALLY_ACCEPT"
      | "TECHNICALLY_REJECT"
      | "FINANCIALLY_EVALUATE"
      | "AWARD",
  ) {
    setFeedback(null);
    startTransition(async () => {
      const result =
        await evaluateOpportunityOfferAction(
          offerId,
          decision,
        );
      setFeedback({
        tone: result.success ? "success" : "error",
        message: result.message ?? "تم تحديث التقييم.",
      });
      if (result.success) router.refresh();
    });
  }

  function createContract() {
    setFeedback(null);
    startTransition(async () => {
      const result = await createContractFromAwardAction(
        data.opportunity.id,
      );
      setFeedback({
        tone: result.success ? "success" : "error",
        message:
          result.message ??
          (result.success
            ? "تم إنشاء مسودة العقد بنجاح."
            : "تعذر إنشاء مسودة العقد."),
      });
      if (result.success) {
        router.push(`/platform/contracts/${result.data.contractId}`);
      }
    });
  }

  return (
    <main className={styles.page}>
      <WorkspaceHeader
        eyebrow={data.opportunity.number}
        title="عروض الموردين"
        description={data.opportunity.title}
        actions={
          <Link
            className="odsButton odsButton--ghost odsButton--md"
            href={`/platform/opportunities/${data.opportunity.id}`}
          >
            العودة إلى المنافسة
          </Link>
        }
      />

      {feedback && (
        <Alert
          tone={feedback.tone === "success" ? "success" : "danger"}
          role={feedback.tone === "success" ? "status" : "alert"}
          aria-live={feedback.tone === "success" ? "polite" : "assertive"}
        >
          {feedback.message}
        </Alert>
      )}

      <nav className={styles.flow} aria-label="مراحل إعداد المنافسة">
        <Link href={`/platform/opportunities/${data.opportunity.id}`}>1 <span>البيانات</span></Link>
        <Link href={`/platform/opportunities/${data.opportunity.id}/boq`}>2 <span>جدول الكميات</span></Link>
        <Link href={`/platform/opportunities/${data.opportunity.id}/partners`}>3 <span>الموردون</span></Link>
        <strong aria-current="page">4 <span>العروض</span></strong>
      </nav>

      <section className={styles.summary}>
        <article><span>العروض المسجلة</span><strong>{data.offers.length}</strong></article>
        <article><span>الموردون المدعوون</span><strong>{data.partners.length}</strong></article>
        <article><span>بنود المنافسة</span><strong>{data.items.length}</strong></article>
      </section>

      {canCreateContract &&
        data.opportunity.status === "AWARDED" && (
          <section className={styles.contractCallout}>
            <div>
              <strong>تمت ترسية المنافسة</strong>
              <p>حوّل العرض الفائز إلى مسودة عقد قابلة للمراجعة.</p>
            </div>
            <Button disabled={pending} onClick={createContract} type="button">
              {pending ? "جارٍ إنشاء العقد..." : "إنشاء مسودة العقد"}
            </Button>
          </section>
        )}

      <DashboardPanel
        title="مقارنة العروض الحالية"
        description="ملخص تجاري سريع للعروض المسجلة."
      >
        {data.offers.length === 0 ? (
          <EmptyState title="لا توجد عروض مسجلة بعد" description="ستظهر العروض هنا بعد تسجيلها." />
        ) : (
          <div className={styles.tableViewport} role="region" aria-label="مقارنة عروض الموردين" tabIndex={0}>
            <table className={styles.table}>
              <caption>مقارنة عروض الموردين</caption>
              <thead><tr><th scope="col">المورد</th><th scope="col">المرجع</th><th scope="col">الحالة</th><th scope="col">قبل الضريبة</th><th scope="col">الضريبة</th><th scope="col">الإجمالي</th><th scope="col">التسليم</th><th scope="col">الصلاحية</th><th scope="col">التقييم والترسية</th></tr></thead>
              <tbody>
                {data.offers.map((offer) => (
                  <tr key={offer.id}>
                    <td><strong>{offer.partnerName}</strong></td>
                    <td>{offer.referenceNumber ?? "—"}</td>
                    <td><Badge tone="neutral">{offer.status}</Badge></td>
                    <td>{money(offer.subtotal)}</td>
                    <td>{money(offer.taxAmount)}</td>
                    <td className={styles.total}>{money(offer.totalAmount)}</td>
                    <td>{offer.deliveryDays ? `${offer.deliveryDays} يوم` : "—"}</td>
                    <td>{offer.validityDays ? `${offer.validityDays} يوم` : "—"}</td>
                    <td>
                      <div className={styles.evaluationActions}>
                        {canEvaluate &&
                          ["SUBMITTED", "UNDER_REVIEW"].includes(
                            offer.status,
                          ) && (
                            <>
                              <Button disabled={pending} onClick={() => evaluate(offer.id, "TECHNICALLY_ACCEPT")} type="button">قبول فني</Button>
                              <Button variant="danger" disabled={pending} onClick={() => evaluate(offer.id, "TECHNICALLY_REJECT")} type="button">رفض فني</Button>
                            </>
                          )}
                        {canEvaluate &&
                          offer.status === "TECHNICALLY_ACCEPTED" && (
                            <Button disabled={pending} onClick={() => evaluate(offer.id, "FINANCIALLY_EVALUATE")} type="button">اعتماد مالي</Button>
                          )}
                        {canAward &&
                          offer.status === "FINANCIALLY_EVALUATED" && (
                            <Button variant="primary" disabled={pending} onClick={() => evaluate(offer.id, "AWARD")} type="button">ترسية</Button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardPanel>

      {canEvaluate && (
        <form action={submit}>
          <FormSection
            title="تسجيل عرض مورد"
            description="أدخل الأسعار التجارية لجميع بنود المنافسة."
            actions={
              <Button disabled={pending} aria-busy={pending} type="submit">
                {pending ? "جارٍ الحفظ..." : "حفظ العرض"}
              </Button>
            }
          >

          {data.partners.length === 0 ? (
            <EmptyState
              title="لا يوجد موردون مدعوون"
              description="أضف الموردين المدعوين أولًا من صفحة شركاء الأعمال."
              actions={
                <Link
                  className="odsButton odsButton--ghost odsButton--md"
                  href={`/platform/opportunities/${data.opportunity.id}/partners`}
                >
                  شركاء الأعمال
                </Link>
              }
            />
          ) : (
            <>
              <div className={styles.fields}>
                <Select id="offer-partner" label="المورد" required value={partnerId} onChange={(event) => setPartnerId(event.target.value)}>{data.partners.map((partner) => <option key={partner.id} value={partner.id}>{partner.name}</option>)}</Select>
                <Input id="offer-reference" label="رقم العرض" name="referenceNumber" />
                <Input id="offer-tax" label="نسبة الضريبة %" min="0" max="100" step="0.01" type="number" value={taxRate} onChange={(event) => setTaxRate(event.target.value)} />
                <Input id="offer-delivery" label="مدة التسليم بالأيام" min="0" name="deliveryDays" type="number" />
                <Input id="offer-validity" label="صلاحية العرض بالأيام" min="1" name="validityDays" type="number" />
                <Input id="offer-payment" label="شروط الدفع" name="paymentTerms" />
              </div>

              <div className={styles.tableViewport} role="region" aria-label="تسعير بنود العرض" tabIndex={0}>
                <table className={styles.table}>
                  <caption>أسعار بنود العرض</caption>
                  <thead><tr><th scope="col">#</th><th scope="col">البند</th><th scope="col">الكمية</th><th scope="col">سعر الوحدة</th><th scope="col">الإجمالي</th></tr></thead>
                  <tbody>
                    {data.items.map((item) => (
                      <tr key={item.id}>
                        <td>{item.lineNumber}</td>
                        <td>{item.description}</td>
                        <td>{item.quantity} {item.unit}</td>
                        <td><Input id={`offer-price-${item.id}`} aria-label={`سعر ${item.description}`} min="0" required step="0.0001" type="number" value={prices[item.id]} onChange={(event) => setPrices((current) => ({ ...current, [item.id]: event.target.value }))} /></td>
                        <td className={styles.total}>{money(Number(item.quantity) * Number(prices[item.id] || 0))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={styles.notes}>
                <Textarea id="offer-technical-notes" label="ملاحظات فنية" name="technicalNotes" rows={3} />
                <Textarea id="offer-commercial-notes" label="ملاحظات تجارية" name="commercialNotes" rows={3} />
                <div className={styles.totals}><span>الإجمالي قبل الضريبة</span><strong>{money(subtotal)}</strong><span>الإجمالي شامل الضريبة</span><strong>{money(total)}</strong></div>
              </div>
            </>
          )}
          </FormSection>
        </form>
      )}
    </main>
  );
}
