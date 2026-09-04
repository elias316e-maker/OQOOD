"use client";

import {
  useState,
  useTransition,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  Alert,
  FormActions,
  FormGuidance,
  FormSection,
} from "@oqood/design-system";

import {
  updateContractDraftAction,
} from "../actions";

import styles from "./contract-edit-form.module.css";

type EditableContract = {
  id: string;
  title: string;
  description: string | null;
  paymentTerms: string | null;
  deliveryDays: number | null;
  startDate: string;
  endDate: string;
};

type ContractEditFormProps = {
  contract: EditableContract;
};

export function ContractEditForm({
  contract,
}: ContractEditFormProps) {
  const router = useRouter();

  const [pending, startTransition] =
    useTransition();

  const [feedback, setFeedback] =
    useState<{
      tone: "success" | "error";
      message: string;
    } | null>(null);

  function submit(formData: FormData) {
    setFeedback(null);

    startTransition(async () => {
      const result =
        await updateContractDraftAction({
          contractId: contract.id,
          title: String(
            formData.get("title") ?? "",
          ),
          description: String(
            formData.get("description") ?? "",
          ),
          paymentTerms: String(
            formData.get("paymentTerms") ??
              "",
          ),
          deliveryDays: String(
            formData.get("deliveryDays") ??
              "",
          ),
          startDate: String(
            formData.get("startDate") ?? "",
          ),
          endDate: String(
            formData.get("endDate") ?? "",
          ),
        });

      setFeedback({
        tone: result.success
          ? "success"
          : "error",
        message: result.message,
      });

      if (result.success) {
        router.push(
          `/platform/contracts/${contract.id}`,
        );
      }
    });
  }

  return (
    <form
      action={submit}
      className={styles.form}
    >
      <FormGuidance
        className={styles.guidance}
        icon="✦"
        title="راجع بيانات مسودة العقد"
        description="تأكد من صحة المدة وشروط الدفع والوصف قبل حفظ المسودة وإرسالها للاعتماد."
      />

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

      <FormSection
        className={styles.section}
        eyebrow="مسودة العقد"
        title="البيانات الأساسية"
        description="عنوان العقد ووصف نطاق الأعمال والالتزامات الرئيسية."
      >
        <div className={styles.fields}>
          <label
            className={styles.wide}
            htmlFor="contract-title"
          >
            عنوان العقد

            <input
              defaultValue={contract.title}
              disabled={pending}
              id="contract-title"
              name="title"
              required
            />
          </label>

          <label
            className={styles.wide}
            htmlFor="contract-description"
          >
            وصف العقد

            <textarea
              defaultValue={
                contract.description ?? ""
              }
              disabled={pending}
              id="contract-description"
              name="description"
              rows={4}
            />
          </label>
        </div>
      </FormSection>

      <FormSection
        className={styles.section}
        eyebrow="الشروط التجارية"
        title="المواعيد وشروط الدفع"
        description="مدة العقد وتواريخ التنفيذ وشروط السداد المتفق عليها."
      >
        <div className={styles.fields}>
          <label htmlFor="contract-start-date">
            تاريخ البدء

            <input
              defaultValue={contract.startDate}
              disabled={pending}
              id="contract-start-date"
              name="startDate"
              type="date"
            />
          </label>

          <label htmlFor="contract-end-date">
            تاريخ الانتهاء

            <input
              defaultValue={contract.endDate}
              disabled={pending}
              id="contract-end-date"
              name="endDate"
              type="date"
            />
          </label>

          <label htmlFor="contract-delivery-days">
            مدة التسليم بالأيام

            <input
              defaultValue={
                contract.deliveryDays ?? ""
              }
              disabled={pending}
              id="contract-delivery-days"
              min="0"
              name="deliveryDays"
              type="number"
            />
          </label>

          <label htmlFor="contract-payment-terms">
            شروط الدفع

            <input
              defaultValue={
                contract.paymentTerms ?? ""
              }
              disabled={pending}
              id="contract-payment-terms"
              name="paymentTerms"
              placeholder="مثال: 30 يومًا من تاريخ الفاتورة"
            />
          </label>
        </div>
      </FormSection>

      <FormActions
        className={styles.actions}
        status="يُتاح تعديل العقد ما دام في حالة المسودة فقط."
      >
        <button
          className={styles.primaryButton}
          disabled={pending}
          type="submit"
        >
          {pending
            ? "جارٍ حفظ التعديلات..."
            : "حفظ التعديلات"}
        </button>

        <button
          className={styles.secondaryButton}
          disabled={pending}
          onClick={() => router.back()}
          type="button"
        >
          إلغاء
        </button>
      </FormActions>
    </form>
  );
}
