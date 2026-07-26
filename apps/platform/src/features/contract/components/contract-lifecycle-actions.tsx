"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { ContractStatus } from "@/generated/prisma/client";

import {
  manageContractLifecycleAction,
  type ContractLifecycleCommand,
} from "../actions/manage-contract-lifecycle";

import styles from "./contract-lifecycle-actions.module.css";

const labels: Record<ContractLifecycleCommand, string> = {
  SUBMIT_FOR_APPROVAL: "إرسال للاعتماد",
  APPROVE: "اعتماد العقد",
  SEND_FOR_SIGNATURE: "إرسال للتوقيع",
  ACTIVATE: "توثيق التوقيع وتفعيل العقد",
};

export function ContractLifecycleActions({
  contractId,
  status,
  canUpdate,
  canApprove,
  canSign,
}: {
  contractId: string;
  status: ContractStatus;
  canUpdate: boolean;
  canApprove: boolean;
  canSign: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] =
    useState<ContractLifecycleCommand | null>(null);
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  const command =
    status === "DRAFT" && canUpdate
      ? "SUBMIT_FOR_APPROVAL"
      : status === "PENDING_APPROVAL" && canApprove
        ? "APPROVE"
        : status === "APPROVED" && canSign
          ? "SEND_FOR_SIGNATURE"
          : status === "SENT_FOR_SIGNATURE" && canSign
            ? "ACTIVATE"
            : null;

  if (!command) return null;

  function execute() {
    if (!selected) return;
    startTransition(async () => {
      const result = await manageContractLifecycleAction(
        contractId,
        selected,
      );
      setFeedback({
        tone: result.success ? "success" : "error",
        message: result.message,
      });
      if (result.success) {
        setSelected(null);
        router.refresh();
      }
    });
  }

  return (
    <div className={styles.wrapper}>
      <button
        className={styles.primary}
        disabled={pending}
        onClick={() => {
          setFeedback(null);
          setSelected(command);
        }}
        type="button"
      >
        {labels[command]}
      </button>

      {selected && (
        <div className={styles.confirmation}>
          <strong>{labels[selected]}</strong>
          <p>سيتم نقل العقد إلى المرحلة التالية وتسجيل الإجراء في سجل النشاط.</p>
          <div>
            <button disabled={pending} onClick={execute} type="button">
              {pending ? "جارٍ التنفيذ..." : "تأكيد"}
            </button>
            <button
              className={styles.dismiss}
              disabled={pending}
              onClick={() => setSelected(null)}
              type="button"
            >
              تراجع
            </button>
          </div>
        </div>
      )}

      {feedback && (
        <p className={styles.feedback} data-tone={feedback.tone} role="status">
          {feedback.message}
        </p>
      )}
    </div>
  );
}
