"use client";

import styles from "./opportunity-lifecycle-actions.module.css";

import {
  useState,
  useTransition,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  archiveOpportunityAction,
} from "../actions/archive-opportunity";

import {
  publishOpportunityAction,
} from "../actions/publish-opportunity";

import type {
  OpportunityResponse,
} from "../dtos";

import {
  Alert,
  Button,
} from "@oqood/design-system";

type OpportunityLifecycleActionsProps = {
  opportunity: Pick<
    OpportunityResponse,
    "id" | "number" | "status" | "closingDate"
  >;
  canPublish: boolean;
  canArchive: boolean;
};

type FeedbackState =
  | {
      type: "success" | "error";
      message: string;
    }
  | null;

const publishableStatuses = new Set<
  OpportunityResponse["status"]
>(["DRAFT", "APPROVED"]);

export function OpportunityLifecycleActions({
  opportunity,
  canPublish,
  canArchive,
}: OpportunityLifecycleActionsProps) {
  const router = useRouter();

  const [isPending, startTransition] =
    useTransition();

  const [
    archiveConfirmationOpen,
    setArchiveConfirmationOpen,
  ] = useState(false);

  const [feedback, setFeedback] =
    useState<FeedbackState>(null);

  const showPublish =
    canPublish &&
    publishableStatuses.has(
      opportunity.status,
    );

  const showArchive =
    canArchive &&
    opportunity.status !== "ARCHIVED";

  const closingDateTimestamp =
    opportunity.closingDate
      ? new Date(
          opportunity.closingDate,
        ).getTime()
      : Number.NaN;

  const publishRequirementsMet =
    Number.isFinite(
      closingDateTimestamp,
    );

  function publishOpportunity() {
    const closingDateIsInFuture =
      publishRequirementsMet &&
      closingDateTimestamp > Date.now();

    if (
      isPending ||
      !showPublish ||
      !closingDateIsInFuture
    ) {
      return;
    }

    setFeedback(null);

    startTransition(async () => {
      const result =
        await publishOpportunityAction({
          opportunityId:
            opportunity.id,
        });

      if (!result.success) {
        setFeedback({
          type: "error",
          message: result.message,
        });

        return;
      }

      setFeedback({
        type: "success",
        message:
          result.message ??
          "تم نشر الفرصة بنجاح.",
      });

      router.refresh();
    });
  }

  function requestArchive() {
    if (
      isPending ||
      !showArchive
    ) {
      return;
    }

    setFeedback(null);
    setArchiveConfirmationOpen(true);
  }

  function cancelArchive() {
    if (isPending) {
      return;
    }

    setArchiveConfirmationOpen(false);
  }

  function confirmArchive() {
    if (
      isPending ||
      !showArchive
    ) {
      return;
    }

    setFeedback(null);

    startTransition(async () => {
      const result =
        await archiveOpportunityAction({
          opportunityId:
            opportunity.id,
        });

      if (!result.success) {
        setFeedback({
          type: "error",
          message: result.message,
        });

        return;
      }

      setArchiveConfirmationOpen(false);

      setFeedback({
        type: "success",
        message:
          result.message ??
          "تمت أرشفة الفرصة بنجاح.",
      });

      router.refresh();
    });
  }

  return (
    <div className={styles.root}>
      <div className={styles.actions}>
        {showPublish && (
          <Button
            variant="primary"
            type="button"
            onClick={publishOpportunity}
            disabled={
              isPending ||
              !publishRequirementsMet
            }
            aria-disabled={
              isPending ||
              !publishRequirementsMet
            }
          >
            {isPending
              ? "جارٍ تنفيذ العملية..."
              : "نشر الفرصة"}
          </Button>
        )}

        {showArchive && (
          <Button
            variant="outline"
            type="button"
            onClick={requestArchive}
            disabled={isPending}
            aria-disabled={isPending}
          >
            أرشفة الفرصة
          </Button>
        )}
      </div>

      {showPublish &&
        !publishRequirementsMet && (
          <p
            className={styles.requirement}
            role="status"
          >
            يجب تحديد تاريخ إغلاق
            مستقبلي قبل نشر الفرصة.
          </p>
        )}

      {archiveConfirmationOpen && (
        <section
          className={styles.confirmation}
          role="region"
          aria-labelledby="archive-confirmation-title"
          aria-describedby="archive-confirmation-description"
        >
          <div>
            <span className={styles.eyebrow}>
              تأكيد الأرشفة
            </span>

            <h2
              id="archive-confirmation-title"
            >
              هل تريد أرشفة الفرصة؟
            </h2>

            <p
              id="archive-confirmation-description"
            >
              ستتم أرشفة الفرصة{" "}
              <strong>
                {opportunity.number}
              </strong>
              ، ولن تظهر ضمن الفرص النشطة.
            </p>
          </div>

          <div className={styles.actions}>
            <Button
              variant="outline"
              type="button"
              onClick={cancelArchive}
              disabled={isPending}
            >
              إلغاء
            </Button>

            <Button
              variant="danger"
              type="button"
              onClick={confirmArchive}
              disabled={isPending}
              aria-disabled={isPending}
            >
              {isPending
                ? "جارٍ الأرشفة..."
                : "تأكيد الأرشفة"}
            </Button>
          </div>
        </section>
      )}

      {feedback && (
        <Alert
          tone={
            feedback.type === "success"
              ? "success"
              : "danger"
          }

          role={
            feedback.type === "error"
              ? "alert"
              : "status"
          }
          aria-live={
            feedback.type === "error"
              ? "assertive"
              : "polite"
          }
        >
          {feedback.message}
        </Alert>
      )}
    </div>
  );
}
