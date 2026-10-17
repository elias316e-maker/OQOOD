"use client";

import styles from "./offer-evaluation-manager.module.css";

import {
  useEffect,
  useState,
  useTransition,
} from "react";

import {
  completeOfferEvaluationAction,
} from "../../../actions/complete-offer-evaluation";

import {
  getOfferEvaluationAction,
} from "../../../actions/get-offer-evaluation";

import {
  saveOfferCriterionScoreAction,
} from "../../../actions/save-offer-criterion-score";

import type {
  OfferEvaluationResponse,
} from "../../../dtos";

import {
  Alert,
  Badge,
  Button,
  EmptyState,
  Input,
  Textarea,
} from "@oqood/design-system";

type OfferEvaluationManagerProps = {
  offerId: string | null;
  canEvaluate: boolean;
};

type CriterionDraft = {
  score: string;
  passed: boolean | null;
  notes: string;
};

const categoryLabels: Record<string, string> = {
  TECHNICAL: "فني",
  FINANCIAL: "مالي",
  COMMERCIAL: "تجاري",
  COMPLIANCE: "امتثال",
  DOCUMENT: "مستندات",
  CUSTOM: "مخصص",
};

const scoringMethodLabels: Record<string, string> = {
  PASS_FAIL: "نجاح أو رسوب",
  NUMERIC: "درجة رقمية",
  PERCENTAGE: "نسبة مئوية",
  MANUAL: "تقييم يدوي",
};

function createDrafts(
  evaluation: OfferEvaluationResponse,
): Record<string, CriterionDraft> {
  return Object.fromEntries(
    evaluation.scores.map((criterion) => [
      criterion.criterionId,
      {
        score: criterion.score ?? "",
        passed: criterion.passed,
        notes: criterion.notes ?? "",
      },
    ]),
  );
}

export function OfferEvaluationManager({
  offerId,
  canEvaluate,
}: OfferEvaluationManagerProps) {
  const [evaluation, setEvaluation] =
    useState<OfferEvaluationResponse | null>(null);

  const [drafts, setDrafts] =
    useState<Record<string, CriterionDraft>>({});

  const [loading, setLoading] =
    useState(false);

  const [pending, startTransition] =
    useTransition();

  const [feedback, setFeedback] =
    useState<{
      tone: "success" | "error";
      message: string;
    } | null>(null);

  useEffect(() => {
    if (!offerId) {
      return;
    }

    const selectedOfferId = offerId;
    let active = true;

    async function load(): Promise<void> {
      setLoading(true);
      setFeedback(null);

      const result =
        await getOfferEvaluationAction(
          selectedOfferId,
        );

      if (!active) {
        return;
      }

      setLoading(false);

      if (!result.success) {
        setEvaluation(null);
        setDrafts({});
        setFeedback({
          tone: "error",
          message: result.message,
        });
        return;
      }

      setEvaluation(result.data);
      setDrafts(createDrafts(result.data));
    }

    void load();

    return () => {
      active = false;
    };
  }, [offerId]);

  function updateDraft(
    criterionId: string,
    patch: Partial<CriterionDraft>,
  ): void {
    setDrafts((current) => ({
      ...current,
      [criterionId]: {
        score:
          current[criterionId]?.score ?? "",
        passed:
          current[criterionId]?.passed ?? null,
        notes:
          current[criterionId]?.notes ?? "",
        ...patch,
      },
    }));
  }

  function saveCriterion(
    criterionId: string,
  ): void {
    if (!evaluation) {
      return;
    }

    const criterion = evaluation.scores.find(
      (item) =>
        item.criterionId === criterionId,
    );

    const draft = drafts[criterionId];

    if (!criterion || !draft) {
      return;
    }

    setFeedback(null);

    startTransition(async () => {
      const result =
        await saveOfferCriterionScoreAction({
          offerId: evaluation.offer.id,
          criterionId,
          score:
            criterion.scoringMethod === "PASS_FAIL"
              ? null
              : draft.score,
          passed:
            criterion.scoringMethod === "PASS_FAIL"
              ? draft.passed
              : null,
          notes: draft.notes.trim() || null,
        });

      if (!result.success) {
        setFeedback({
          tone: "error",
          message: result.message,
        });
        return;
      }

      setEvaluation(result.data);
      setDrafts(createDrafts(result.data));
      setFeedback({
        tone: "success",
        message:
          result.message ??
          "تم حفظ تقييم المعيار.",
      });
    });
  }

  function completeEvaluation(): void {
    if (!evaluation) {
      return;
    }

    setFeedback(null);

    startTransition(async () => {
      const result =
        await completeOfferEvaluationAction(
          evaluation.offer.id,
        );

      if (!result.success) {
        setFeedback({
          tone: "error",
          message: result.message,
        });
        return;
      }

      setEvaluation(result.data);
      setDrafts(createDrafts(result.data));
      setFeedback({
        tone: "success",
        message:
          result.message ??
          "تم اعتماد التقييم الفني.",
      });
    });
  }

  if (!offerId) {
    return (
      <section className={styles.manager}>
        <EmptyState
          title="اختر عرضًا لبدء التقييم"
          description="اختر أحد عروض الموردين من الجدول لعرض معايير التقييم وإدخال الدرجات."
        />
      </section>
    );
  }

  if (loading) {
    return (
      <section className={styles.manager}>
        <EmptyState
          title="جارٍ تحميل التقييم..."
          role="status"
          aria-live="polite"
          aria-busy="true"
        />
      </section>
    );
  }

  if (!evaluation) {
    return (
      <section className={styles.manager}>
        {feedback && (
          <Alert
             tone="danger"
            role="alert"
          >
            {feedback.message}
          </Alert>
        )}
      </section>
    );
  }

  const summary = evaluation.summary;

  return (
    <section className={styles.manager}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>
            تقييم العرض
          </span>

          <h2>{evaluation.offer.partnerName}</h2>

          <p>
            {evaluation.offer.referenceNumber ??
              "لا يوجد رقم مرجعي للعرض"}
          </p>
        </div>

        <Badge tone="neutral">
          {evaluation.offer.status}
        </Badge>
      </header>

      <div className={styles.summary}>
        <article>
          <span>النتيجة الموزونة</span>
          <strong>
            {Number(summary.totalWeightedScore).toFixed(2)}
          </strong>
        </article>

        <article>
          <span>الوزن المقيم</span>
          <strong>
            {Number(summary.evaluatedWeight)}%
          </strong>
        </article>

        <article>
          <span>المعايير المكتملة</span>
          <strong>
            {summary.completedCriteriaCount}/
            {summary.totalCriteriaCount}
          </strong>
        </article>

        <article>
          <span>المتطلبات الإلزامية</span>
          <strong>
            {summary.failedRequiredCriteriaCount === 0
              ? "مستوفاة"
              : "غير مستوفاة"}
          </strong>
        </article>
      </div>

      {feedback && (
        <Alert
          tone={
            feedback.tone === "success"
              ? "success"
              : "danger"
          }

          role={
            feedback.tone === "success"
              ? "status"
              : "alert"
          }
        >
          {feedback.message}
        </Alert>
      )}

      {evaluation.scores.length === 0 ? (
        <EmptyState
          title="لا توجد معايير نشطة"
          description="أضف معايير التقييم إلى المنافسة قبل تقييم عروض الموردين."
        />
      ) : (
        <div className={styles.criteria}>
          {evaluation.scores.map((criterion) => {
            const draft =
              drafts[criterion.criterionId] ?? {
                score: "",
                passed: null,
                notes: "",
              };

            const passFail =
              criterion.scoringMethod ===
              "PASS_FAIL";

            return (
              <article
                className={styles.criterion}
                key={criterion.criterionId}
              >
                <header>
                  <div>
                    <span>
                      {categoryLabels[
                        criterion.category
                      ] ?? criterion.category}
                    </span>

                    <h3>
                      {criterion.criterionName}
                    </h3>

                    <p>
                      الوزن:{" "}
                      {Number(criterion.weight)}%
                      {criterion.required
                        ? " — إلزامي"
                        : ""}
                    </p>
                  </div>

                  <strong>
                    {scoringMethodLabels[
                      criterion.scoringMethod
                    ] ??
                      criterion.scoringMethod}
                  </strong>
                </header>

                <div className={styles.fields}>
                  {passFail ? (
                    <fieldset>
                      <legend>نتيجة المعيار</legend>

                      <label>
                        <input
                          checked={
                            draft.passed === true
                          }
                          disabled={
                            !canEvaluate || pending
                          }
                          name={`criterion-${criterion.criterionId}`}
                          onChange={() =>
                            updateDraft(
                              criterion.criterionId,
                              {
                                passed: true,
                              },
                            )
                          }
                          type="radio"
                        />
                        ناجح
                      </label>

                      <label>
                        <input
                          checked={
                            draft.passed === false
                          }
                          disabled={
                            !canEvaluate || pending
                          }
                          name={`criterion-${criterion.criterionId}`}
                          onChange={() =>
                            updateDraft(
                              criterion.criterionId,
                              {
                                passed: false,
                              },
                            )
                          }
                          type="radio"
                        />
                        راسب
                      </label>
                    </fieldset>
                  ) : (
                    <Input
                        id={`criterion-score-${criterion.criterionId}`}
                        label="الدرجة من 100"
                        disabled={
                          !canEvaluate || pending
                        }
                        max="100"
                        min="0"
                        onChange={(event) =>
                          updateDraft(
                            criterion.criterionId,
                            {
                              score:
                                event.target.value,
                            },
                          )
                        }
                        step="0.01"
                        type="number"
                        value={draft.score}
                      />
                  )}

                  <div className={styles.notes}>
<Textarea
                        id={`criterion-notes-${criterion.criterionId}`}
                        label="ملاحظات المقيم"
                      disabled={
                        !canEvaluate || pending
                      }
                      maxLength={2000}
                      onChange={(event) =>
                        updateDraft(
                          criterion.criterionId,
                          {
                            notes:
                              event.target.value,
                          },
                        )
                      }
                      rows={3}
                      value={draft.notes}
                    />
                  </div>
                </div>

                <footer>
                  <span>
                    الحد الأدنى:{" "}
                    {criterion.minimumScore ===
                    null
                      ? "غير محدد"
                      : Number(
                          criterion.minimumScore,
                        )}
                  </span>

                  {canEvaluate && (
                    <Button
                      variant="outline"
                      disabled={pending}
                      onClick={() =>
                        saveCriterion(
                          criterion.criterionId,
                        )
                      }
                      type="button"
                    >
                      {pending
                        ? "جارٍ الحفظ..."
                        : "حفظ المعيار"}
                    </Button>
                  )}
                </footer>
              </article>
            );
          })}
        </div>
      )}

      {canEvaluate &&
        evaluation.scores.length > 0 && (
          <footer className={styles.footer}>
            <span>
              يجب استكمال جميع المعايير النشطة
              قبل اعتماد التقييم.
            </span>

            <Button
              variant="primary"
              disabled={
                pending || !summary.complete
              }
              onClick={completeEvaluation}
              type="button"
            >
              {pending
                ? "جارٍ الاعتماد..."
                : "اعتماد التقييم الفني"}
            </Button>
          </footer>
        )}
    </section>
  );
}
