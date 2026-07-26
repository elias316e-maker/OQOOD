"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateContractDraftAction } from "../actions";

import styles from "./contract-edit-form.module.css";

export function ContractEditForm({ contract }: {
  contract: {
    id: string;
    title: string;
    description: string | null;
    paymentTerms: string | null;
    deliveryDays: number | null;
    startDate: string;
    endDate: string;
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ tone: string; message: string } | null>(null);

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await updateContractDraftAction({
        contractId: contract.id,
        title: String(formData.get("title") ?? ""),
        description: String(formData.get("description") ?? ""),
        paymentTerms: String(formData.get("paymentTerms") ?? ""),
        deliveryDays: String(formData.get("deliveryDays") ?? ""),
        startDate: String(formData.get("startDate") ?? ""),
        endDate: String(formData.get("endDate") ?? ""),
      });
      setFeedback({ tone: result.success ? "success" : "error", message: result.message });
      if (result.success) router.push(`/platform/contracts/${contract.id}`);
    });
  }

  return (
    <form action={submit} className={styles.form}>
      <label>عنوان العقد<input defaultValue={contract.title} name="title" required /></label>
      <label className={styles.wide}>وصف العقد<textarea defaultValue={contract.description ?? ""} name="description" rows={4} /></label>
      <label>تاريخ البدء<input defaultValue={contract.startDate} name="startDate" type="date" /></label>
      <label>تاريخ الانتهاء<input defaultValue={contract.endDate} name="endDate" type="date" /></label>
      <label>مدة التسليم بالأيام<input defaultValue={contract.deliveryDays ?? ""} min="0" name="deliveryDays" type="number" /></label>
      <label>شروط الدفع<input defaultValue={contract.paymentTerms ?? ""} name="paymentTerms" /></label>
      {feedback && <p className={styles.feedback} data-tone={feedback.tone}>{feedback.message}</p>}
      <div className={styles.actions}>
        <button disabled={pending} type="submit">{pending ? "جارٍ الحفظ..." : "حفظ التعديلات"}</button>
        <button disabled={pending} onClick={() => router.back()} type="button">إلغاء</button>
      </div>
    </form>
  );
}
