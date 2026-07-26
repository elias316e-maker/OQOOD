"use client";

import Link from "next/link";
import {
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";

import {
  saveOpportunityOfferAction,
  type OpportunityOfferData,
} from "../actions/manage-opportunity-offers";

import styles from "./opportunity-offers-form.module.css";

export function OpportunityOffersForm({
  data,
  canEvaluate,
}: {
  data: OpportunityOfferData;
  canEvaluate: boolean;
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

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <span>{data.opportunity.number}</span>
          <h1>عروض الموردين</h1>
          <p>{data.opportunity.title}</p>
        </div>
        <Link href={`/platform/opportunities/${data.opportunity.id}`}>
          العودة إلى المنافسة
        </Link>
      </header>

      <section className={styles.summary}>
        <article><span>العروض المسجلة</span><strong>{data.offers.length}</strong></article>
        <article><span>الموردون المدعوون</span><strong>{data.partners.length}</strong></article>
        <article><span>بنود المنافسة</span><strong>{data.items.length}</strong></article>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div><h2>مقارنة العروض الحالية</h2><p>ملخص تجاري سريع للعروض المسجلة.</p></div>
        </div>
        {data.offers.length === 0 ? (
          <p className={styles.empty}>لا توجد عروض مسجلة بعد.</p>
        ) : (
          <div className={styles.tableViewport}>
            <table className={styles.table}>
              <thead><tr><th>المورد</th><th>المرجع</th><th>الحالة</th><th>قبل الضريبة</th><th>الضريبة</th><th>الإجمالي</th><th>التسليم</th><th>الصلاحية</th></tr></thead>
              <tbody>
                {data.offers.map((offer) => (
                  <tr key={offer.id}>
                    <td><strong>{offer.partnerName}</strong></td>
                    <td>{offer.referenceNumber ?? "—"}</td>
                    <td>{offer.status}</td>
                    <td>{money(offer.subtotal)}</td>
                    <td>{money(offer.taxAmount)}</td>
                    <td className={styles.total}>{money(offer.totalAmount)}</td>
                    <td>{offer.deliveryDays ? `${offer.deliveryDays} يوم` : "—"}</td>
                    <td>{offer.validityDays ? `${offer.validityDays} يوم` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {canEvaluate && (
        <form action={submit} className={styles.panel}>
          <div className={styles.panelHeader}>
            <div><h2>تسجيل عرض مورد</h2><p>أدخل الأسعار التجارية لجميع بنود المنافسة.</p></div>
            <button disabled={pending} type="submit">
              {pending ? "جارٍ الحفظ..." : "حفظ العرض"}
            </button>
          </div>

          {feedback && (
            <p className={styles.feedback} data-tone={feedback.tone} role="status">
              {feedback.message}
            </p>
          )}

          {data.partners.length === 0 ? (
            <p className={styles.empty}>
              أضف الموردين المدعوين أولاً من صفحة شركاء الأعمال.
            </p>
          ) : (
            <>
              <div className={styles.fields}>
                <label>المورد<select required value={partnerId} onChange={(event) => setPartnerId(event.target.value)}>{data.partners.map((partner) => <option key={partner.id} value={partner.id}>{partner.name}</option>)}</select></label>
                <label>رقم العرض<input name="referenceNumber" /></label>
                <label>نسبة الضريبة %<input min="0" max="100" step="0.01" type="number" value={taxRate} onChange={(event) => setTaxRate(event.target.value)} /></label>
                <label>مدة التسليم بالأيام<input min="0" name="deliveryDays" type="number" /></label>
                <label>صلاحية العرض بالأيام<input min="1" name="validityDays" type="number" /></label>
                <label>شروط الدفع<input name="paymentTerms" /></label>
              </div>

              <div className={styles.tableViewport}>
                <table className={styles.table}>
                  <thead><tr><th>#</th><th>البند</th><th>الكمية</th><th>سعر الوحدة</th><th>الإجمالي</th></tr></thead>
                  <tbody>
                    {data.items.map((item) => (
                      <tr key={item.id}>
                        <td>{item.lineNumber}</td>
                        <td>{item.description}</td>
                        <td>{item.quantity} {item.unit}</td>
                        <td><input aria-label={`سعر ${item.description}`} min="0" required step="0.0001" type="number" value={prices[item.id]} onChange={(event) => setPrices((current) => ({ ...current, [item.id]: event.target.value }))} /></td>
                        <td className={styles.total}>{money(Number(item.quantity) * Number(prices[item.id] || 0))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={styles.notes}>
                <label>ملاحظات فنية<textarea name="technicalNotes" rows={3} /></label>
                <label>ملاحظات تجارية<textarea name="commercialNotes" rows={3} /></label>
                <div><span>الإجمالي قبل الضريبة</span><strong>{money(subtotal)}</strong><span>الإجمالي شامل الضريبة</span><strong>{money(total)}</strong></div>
              </div>
            </>
          )}
        </form>
      )}
    </main>
  );
}
