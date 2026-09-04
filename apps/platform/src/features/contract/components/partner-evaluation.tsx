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
  EmptyState,
} from "@oqood/design-system";

import {
  evaluateContractPartnerAction,
} from "../actions";

import styles from "./partner-evaluation.module.css";

type PartnerEvaluationItem = {
  id: string;
  overallScore: string;
  timelinessScore: number;
  qualityScore: number;
  responsivenessScore: number;
  financialScore: number;
  notes: string | null;
  createdAt: string;
  createdBy: string;
};

type PartnerEvaluationProps = {
  contractId: string;
  canEvaluate: boolean;
  evaluations: PartnerEvaluationItem[];
};

const fields = [
  [
    "timelinessScore",
    "الالتزام بالمواعيد",
  ],
  [
    "qualityScore",
    "جودة التسليم",
  ],
  [
    "responsivenessScore",
    "الاستجابة",
  ],
  [
    "financialScore",
    "الأداء المالي",
  ],
] as const;

export function PartnerEvaluation({
  contractId,
  evaluations,
  canEvaluate,
}: PartnerEvaluationProps) {
  const router = useRouter();

  const [pending, startTransition] =
    useTransition();

  const [feedback, setFeedback] =
    useState<{
      tone: "success" | "error";
      message: string;
    } | null>(null);

  return (
    <div className={styles.wrapper}>
      {canEvaluate ? (
        <form
          action={(formData) =>
            startTransition(async () => {
              const result =
                await evaluateContractPartnerAction({
                  contractId,
                  timelinessScore: Number(
                    formData.get(
                      "timelinessScore",
                    ),
                  ),
                  qualityScore: Number(
                    formData.get(
                      "qualityScore",
                    ),
                  ),
                  responsivenessScore: Number(
                    formData.get(
                      "responsivenessScore",
                    ),
                  ),
                  financialScore: Number(
                    formData.get(
                      "financialScore",
                    ),
                  ),
                  notes: String(
                    formData.get("notes") ??
                      "",
                  ),
                });

              setFeedback({
                tone: result.success
                  ? "success"
                  : "error",
                message: result.message,
              });

              if (result.success) {
                router.refresh();
              }
            })
          }
        >
          {fields.map(
            ([name, label]) => (
              <label key={name}>
                {label}

                <select
                  defaultValue="5"
                  name={name}
                >
                  {[5, 4, 3, 2, 1].map(
                    (value) => (
                      <option
                        key={value}
                        value={value}
                      >
                        {value} / 5
                      </option>
                    ),
                  )}
                </select>
              </label>
            ),
          )}

          <label className={styles.wide}>
            ملاحظات

            <textarea
              name="notes"
              rows={2}
            />
          </label>

          <button
            disabled={pending}
            type="submit"
          >
            {pending
              ? "جارٍ حفظ التقييم..."
              : "حفظ التقييم"}
          </button>
        </form>
      ) : null}

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

      {evaluations.length === 0 ? (
        <EmptyState
          className={styles.emptyState}
          icon="★"
          title="لا توجد تقييمات للمورد"
          description="لم يُسجل أي تقييم لأداء المورد على هذا العقد حتى الآن."
          role="status"
        />
      ) : (
        <div className={styles.history}>
          {evaluations.map(
            (evaluation) => (
              <article key={evaluation.id}>
                <strong>
                  {Number(
                    evaluation.overallScore,
                  ).toFixed(1)}{" "}
                  / 5
                </strong>

                <span>
                  {evaluation.createdBy} ·{" "}
                  {new Intl.DateTimeFormat(
                    "ar-SA",
                  ).format(
                    new Date(
                      evaluation.createdAt,
                    ),
                  )}
                </span>

                <small>
                  المواعيد{" "}
                  {evaluation.timelinessScore} ·
                  الجودة{" "}
                  {evaluation.qualityScore} ·
                  الاستجابة{" "}
                  {
                    evaluation.responsivenessScore
                  }{" "}
                  · المالي{" "}
                  {evaluation.financialScore}
                </small>

                {evaluation.notes ? (
                  <p>{evaluation.notes}</p>
                ) : null}
              </article>
            ),
          )}
        </div>
      )}
    </div>
  );
}
