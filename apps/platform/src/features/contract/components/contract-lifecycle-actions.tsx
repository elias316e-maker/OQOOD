"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  Alert,
} from "@oqood/design-system";

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
  SUSPEND: "إيقاف العقد",
  RESUME: "استئناف العقد",
  COMPLETE: "إكمال العقد",
  TERMINATE: "إنهاء العقد",
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
  const [reason, setReason] = useState("");

  const commands: ContractLifecycleCommand[] = [];
  if (status === "DRAFT" && canUpdate) commands.push("SUBMIT_FOR_APPROVAL");
  if (status === "PENDING_APPROVAL" && canApprove) commands.push("APPROVE");
  if (status === "APPROVED" && canSign) commands.push("SEND_FOR_SIGNATURE");
  if (status === "SENT_FOR_SIGNATURE" && canSign) commands.push("ACTIVATE");
  if (status === "ACTIVE" && canUpdate) {
    commands.push("SUSPEND", "COMPLETE", "TERMINATE");
  }
  if (status === "SUSPENDED" && canUpdate) {
    commands.push("RESUME", "TERMINATE");
  }

  if (commands.length === 0) return null;

  function execute() {
    if (!selected) return;
    startTransition(async () => {
      const result = await manageContractLifecycleAction(
        contractId,
        selected,
        reason,
      );
      setFeedback({
        tone: result.success ? "success" : "error",
        message: result.message,
      });
      if (result.success) {
        setSelected(null);
        setReason("");
        router.refresh();
      }
    });
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.actions}>
        {commands.map((command) => (
          <button
            className={styles.primary}
            data-command={command}
            disabled={pending}
            key={command}
            onClick={() => {
              setFeedback(null);
              setReason("");
              setSelected(command);
            }}
            type="button"
          >
            {labels[command]}
          </button>
        ))}
      </div>

      {selected && (
        <Alert
          className={styles.confirmation}
          tone="warning"
          title={labels[selected]}
        >
<p>سيتم نقل العقد إلى المرحلة التالية وتسجيل الإجراء في سجل النشاط.</p>
          {["SUSPEND", "TERMINATE"].includes(selected) && (
            <label>
              سبب الإجراء
              <textarea
                disabled={pending}
                onChange={(event) => setReason(event.target.value)}
                placeholder="اكتب سبباً واضحاً"
                rows={3}
                value={reason}
              />
            </label>
          )}
          <div className={styles.confirmationActions}>
            <button
              disabled={
                pending ||
                (["SUSPEND", "TERMINATE"].includes(selected) &&
                  !reason.trim())
              }
              onClick={execute}
              type="button"
            >
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
        </Alert>
      )}

      {feedback && (
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
      )}
    </div>
  );
}
