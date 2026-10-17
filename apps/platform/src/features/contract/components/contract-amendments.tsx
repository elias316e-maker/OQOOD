"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  Alert,
  EmptyState,
} from "@oqood/design-system";

import {
  createContractAmendmentAction,
  transitionContractAmendmentAction,
} from "../actions";

import styles from "./contract-amendments.module.css";

type Amendment = {
  id: string;
  number: number;
  title: string;
  reason: string;
  status: string;
  valueChange: string;
  resultingTotal: string;
  newEndDate: string | null;
  createdAt: string;
};

export function ContractAmendments({
  contractId,
  currency,
  amendments,
  canUpdate,
  canApprove,
}: {
  contractId: string;
  currency: string;
  amendments: Amendment[];
  canUpdate: boolean;
  canApprove: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ tone: string; message: string } | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const money = (value: string) =>
    new Intl.NumberFormat("ar-SA", { style: "currency", currency }).format(Number(value));

  function create(formData: FormData) {
    startTransition(async () => {
      const result = await createContractAmendmentAction({
        contractId,
        title: String(formData.get("title") ?? ""),
        reason: String(formData.get("reason") ?? ""),
        valueChange: String(formData.get("valueChange") ?? ""),
        newEndDate: String(formData.get("newEndDate") ?? ""),
      });
      setFeedback({ tone: result.success ? "success" : "error", message: result.message });
      if (result.success) router.refresh();
    });
  }

  function transition(
    amendmentId: string,
    command: "SUBMIT" | "APPROVE" | "REJECT",
  ) {
    startTransition(async () => {
      const result = await transitionContractAmendmentAction({
        contractId,
        amendmentId,
        command,
        reason: command === "REJECT" ? reason : undefined,
      });
      setFeedback({ tone: result.success ? "success" : "error", message: result.message });
      if (result.success) {
        setRejecting(null);
        setReason("");
        router.refresh();
      }
    });
  }

  return (
    <div className={styles.wrapper}>
      {canUpdate && (
        <form action={create} className={styles.createForm}>
          <h3>إنشاء ملحق جديد</h3>
          <label>عنوان الملحق<input name="title" required /></label>
          <label>التغيير في قيمة العقد<input defaultValue="0" name="valueChange" step="0.01" type="number" /></label>
          <label>تاريخ الانتهاء الجديد<input name="newEndDate" type="date" /></label>
          <label className={styles.wide}>سبب الملحق<textarea name="reason" required rows={3} /></label>
          <button disabled={pending} type="submit">حفظ مسودة الملحق</button>
        </form>
      )}

      {feedback ? (
        <Alert
          className={styles.feedback}
          tone={
            feedback.tone === "success"
              ? "success"
              : "danger"
          }
          aria-live={
            feedback.tone === "success"
              ? "polite"
              : "assertive"
          }
        >
          {feedback.message}
        </Alert>
      ) : null}

      <div className={styles.list}>
        {amendments.length === 0 ? (
          <EmptyState
            className={styles.empty}
            icon="▤"
            title="لا توجد ملاحق للعقد"
            description="لم تتم إضافة أي ملاحق أو تعديلات إلى هذا العقد حتى الآن."
            role="status"
          />
        ) : null}
        {amendments.map((amendment) => (
          <article key={amendment.id}>
            <header>
              <div><span>ملحق رقم {amendment.number}</span><strong>{amendment.title}</strong></div>
              <b>{amendment.status}</b>
            </header>
            <p>{amendment.reason}</p>
            <dl>
              <div><dt>التغير المالي</dt><dd>{money(amendment.valueChange)}</dd></div>
              <div><dt>القيمة بعد الملحق</dt><dd>{money(amendment.resultingTotal)}</dd></div>
              <div><dt>الانتهاء الجديد</dt><dd>{amendment.newEndDate ? new Intl.DateTimeFormat("ar-SA").format(new Date(amendment.newEndDate)) : "دون تغيير"}</dd></div>
            </dl>
            <footer>
              {canUpdate && amendment.status === "DRAFT" && (
                <button disabled={pending} onClick={() => transition(amendment.id, "SUBMIT")} type="button">إرسال للاعتماد</button>
              )}
              {canApprove && amendment.status === "PENDING_APPROVAL" && (
                <>
                  <button disabled={pending} onClick={() => transition(amendment.id, "APPROVE")} type="button">اعتماد وتطبيق</button>
                  <button data-tone="danger" disabled={pending} onClick={() => setRejecting(amendment.id)} type="button">رفض</button>
                </>
              )}
            </footer>
            {rejecting === amendment.id && (
              <Alert
                className={styles.reject}
                tone="warning"
                title="تأكيد رفض الملحق"
                aria-live="polite"
              >
                <textarea onChange={(event) => setReason(event.target.value)} placeholder="سبب الرفض" rows={2} value={reason} />
                <button disabled={pending || !reason.trim()} onClick={() => transition(amendment.id, "REJECT")} type="button">تأكيد الرفض</button>
              </Alert>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
