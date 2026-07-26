"use client";

import {
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";

import type {
  ProcurementRequestStatus,
} from "@/generated/prisma/client";

import {
  approveProcurementRequestAction,
  archiveProcurementRequestAction,
  cancelProcurementRequestAction,
  rejectProcurementRequestAction,
  requestProcurementChangesAction,
  startProcurementReviewAction,
  submitProcurementRequestAction,
} from "../actions/manage-procurement-lifecycle";

import styles from "./procurement-lifecycle-actions.module.css";

type Command =
  | "submit"
  | "startReview"
  | "requestChanges"
  | "approve"
  | "reject"
  | "cancel"
  | "archive";

type Props = {
  request: {
    id: string;
    status: ProcurementRequestStatus;
    itemCount: number;
  };
  canUpdate: boolean;
  canApprove: boolean;
  canArchive: boolean;
};

const commandLabels: Record<Command, string> = {
  submit: "إرسال للمراجعة",
  startReview: "بدء المراجعة",
  requestChanges: "طلب تعديلات",
  approve: "اعتماد الطلب",
  reject: "رفض الطلب",
  cancel: "إلغاء الطلب",
  archive: "أرشفة الطلب",
};

export function ProcurementLifecycleActions({
  request,
  canUpdate,
  canApprove,
  canArchive,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] =
    useState<Command | null>(null);
  const [reason, setReason] = useState("");
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  const commands: Command[] = [];

  if (
    canUpdate &&
    (request.status === "DRAFT" ||
      request.status === "CHANGES_REQUESTED")
  ) {
    commands.push("submit");
  }
  if (canApprove && request.status === "SUBMITTED") {
    commands.push("startReview");
  }
  if (canApprove && request.status === "UNDER_REVIEW") {
    commands.push("approve", "requestChanges", "reject");
  }
  if (
    canUpdate &&
    ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "CHANGES_REQUESTED"]
      .includes(request.status)
  ) {
    commands.push("cancel");
  }
  if (
    canArchive &&
    ["APPROVED", "REJECTED", "CANCELLED"]
      .includes(request.status)
  ) {
    commands.push("archive");
  }

  if (commands.length === 0) {
    return null;
  }

  function execute(command: Command) {
    if (command === "submit" && request.itemCount === 0) {
      setFeedback({
        tone: "error",
        message: "أضف بنداً واحداً على الأقل قبل إرسال الطلب.",
      });
      return;
    }

    startTransition(async () => {
      const input = {
        procurementRequestId: request.id,
        ...(["requestChanges", "reject"].includes(command)
          ? { reason: reason.trim() }
          : {}),
      };
      const result =
        command === "submit"
          ? await submitProcurementRequestAction(input)
          : command === "startReview"
            ? await startProcurementReviewAction(input)
            : command === "requestChanges"
              ? await requestProcurementChangesAction(input)
              : command === "approve"
                ? await approveProcurementRequestAction(input)
                : command === "reject"
                  ? await rejectProcurementRequestAction(input)
                  : command === "cancel"
                    ? await cancelProcurementRequestAction(input)
                    : await archiveProcurementRequestAction(input);

      if (!result.success) {
        setFeedback({
          tone: "error",
          message: result.message,
        });
        return;
      }

      setFeedback({
        tone: "success",
        message: result.message ?? "تم تنفيذ الإجراء بنجاح.",
      });
      setSelected(null);
      setReason("");
      router.refresh();
    });
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.actions}>
        {commands.map((command) => (
          <button
            className={styles.action}
            data-command={command}
            disabled={pending}
            key={command}
            onClick={() => {
              setFeedback(null);
              setSelected(command);
            }}
            type="button"
          >
            {commandLabels[command]}
          </button>
        ))}
      </div>

      {selected && (
        <div className={styles.confirmation}>
          <strong>{commandLabels[selected]}</strong>
          <p>هل تريد تنفيذ هذا الإجراء على الطلب الحالي؟</p>

          {["requestChanges", "reject"].includes(selected) && (
            <label>
              السبب
              <textarea
                disabled={pending}
                onChange={(event) =>
                  setReason(event.target.value)
                }
                placeholder="اكتب سبباً واضحاً لصاحب الطلب"
                rows={3}
                value={reason}
              />
            </label>
          )}

          <div>
            <button
              className={styles.confirm}
              disabled={
                pending ||
                (["requestChanges", "reject"].includes(selected) &&
                  !reason.trim())
              }
              onClick={() => execute(selected)}
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
        </div>
      )}

      {feedback && (
        <p
          className={styles.feedback}
          data-tone={feedback.tone}
          role="status"
        >
          {feedback.message}
        </p>
      )}
    </div>
  );
}
