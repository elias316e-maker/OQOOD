"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  createRfqFromProcurementAction,
} from "../actions/create-rfq-from-procurement";

import styles from "./procurement-rfq-action.module.css";

export function ProcurementRfqAction({
  procurementRequestId,
}: {
  procurementRequestId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(
    null,
  );

  function createRfq() {
    setFeedback(null);
    startTransition(async () => {
      const result =
        await createRfqFromProcurementAction(
          procurementRequestId,
        );

      if (!result.success) {
        setFeedback(result.message);
        return;
      }

      router.push(
        `/platform/opportunities/${result.data.opportunityId}`,
      );
      router.refresh();
    });
  }

  return (
    <div className={styles.wrapper}>
      <button
        disabled={pending}
        onClick={createRfq}
        type="button"
      >
        {pending
          ? "جارٍ إنشاء طلب عرض السعر..."
          : "إنشاء طلب عرض سعر RFQ"}
      </button>
      {feedback && <p role="alert">{feedback}</p>}
    </div>
  );
}
