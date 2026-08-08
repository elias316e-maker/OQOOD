"use client";

import {
  useState,
  useTransition,
} from "react";

import {
  completeFinancialEvaluationAction,
  recommendFinancialAwardAction,
} from "../../../actions";

import type {
  FinancialEvaluationResponse,
} from "../../../dtos";

import {
  Alert,
} from "@oqood/design-system";

type FinancialEvaluationManagerProps = {
  evaluation: FinancialEvaluationResponse;
  canEvaluate: boolean;
};

function formatMoney(
  value: string,
  currency: string,
): string {
  try {
    return new Intl.NumberFormat("ar-SA", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number(value));
  } catch {
    return value;
  }
}

export function FinancialEvaluationManager({
  evaluation: initialEvaluation,
  canEvaluate,
}: FinancialEvaluationManagerProps) {
  const [evaluation, setEvaluation] =
    useState(initialEvaluation);

  const [pending, startTransition] =
    useTransition();

  const [feedback, setFeedback] =
    useState<{
      tone: "success" | "error";
      message: string;
    } | null>(null);

  const canComplete =
    evaluation.summary.eligibleOffersCount > 0 &&
    evaluation.offers.some(
      (offer) =>
        offer.status ===
        "TECHNICALLY_ACCEPTED",
    );

  const canRecommend =
    evaluation.summary.evaluatedOffersCount > 0 &&
    evaluation.opportunity.status !==
      "AWARD_PENDING";

  function completeEvaluation(): void {
    setFeedback(null);

    startTransition(async () => {
      const result =
        await completeFinancialEvaluationAction(
          evaluation.opportunity.id,
        );

      if (!result.success) {
        setFeedback({
          tone: "error",
          message: result.message,
        });
        return;
      }

      setEvaluation(result.data);
      setFeedback({
        tone: "success",
        message:
          result.message ??
          "تم إكمال التقييم المالي.",
      });
    });
  }

  function recommendAward(): void {
    setFeedback(null);

    startTransition(async () => {
      const result =
        await recommendFinancialAwardAction(
          evaluation.opportunity.id,
        );

      if (!result.success) {
        setFeedback({
          tone: "error",
          message: result.message,
        });
        return;
      }

      setEvaluation(result.data);
      setFeedback({
        tone: "success",
        message:
          result.message ??
          "تم إنشاء توصية الترسية.",
      });
    });
  }

  return (
    <section className="opportunityWorkspaceCard offerEvaluationManager">
      <header className="offerEvaluationManager__header">
        <div>
          <span className="opportunitySectionEyebrow">
            التقييم المالي
          </span>

          <h2>
            تحليل وترتيب العروض المالية
          </h2>

          <p>
            مقارنة العروض المقبولة فنيًا وترتيبها
            حسب القيمة الإجمالية قبل إنشاء توصية
            الترسية.
          </p>
        </div>

        <span className="opportunityEvaluationStatus">
          {evaluation.opportunity.status}
        </span>
      </header>

      <div className="offerEvaluationManager__summary">
        <article>
          <span>العروض المؤهلة</span>
          <strong>
            {evaluation.summary.eligibleOffersCount}
          </strong>
        </article>

        <article>
          <span>العروض المقيّمة ماليًا</span>
          <strong>
            {evaluation.summary.evaluatedOffersCount}
          </strong>
        </article>

        <article>
          <span>أقل عرض</span>
          <strong>
            {evaluation.summary.lowestOfferId
              ? `#${evaluation.summary.lowestOfferId.slice(
                  -6,
                )}`
              : "—"}
          </strong>
        </article>

        <article>
          <span>التوصية الحالية</span>
          <strong>
            {evaluation.summary.recommendedOfferId
              ? `#${evaluation.summary.recommendedOfferId.slice(
                  -6,
                )}`
              : "—"}
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

      {evaluation.offers.length === 0 ? (
        <div className="opportunityWorkspaceEmptyPanel">
          <h2>لا توجد عروض مؤهلة ماليًا</h2>
          <p>
            يجب قبول عرض واحد على الأقل فنيًا
            قبل بدء التقييم المالي.
          </p>
        </div>
      ) : (
        <div className="opportunityEvaluationWorkspace__table">
          <table>
            <thead>
              <tr>
                <th>الترتيب</th>
                <th>المورد</th>
                <th>رقم العرض</th>
                <th>الإجمالي</th>
                <th>الانحراف السعري</th>
                <th>التسليم</th>
                <th>الصلاحية</th>
                <th>الحالة</th>
              </tr>
            </thead>

            <tbody>
              {evaluation.offers.map(
                (offer) => (
                  <tr
                    className={
                      offer.recommended
                        ? "is-selected"
                        : undefined
                    }
                    key={offer.offerId}
                  >
                    <td>
                      <strong>
                        #{offer.rank}
                      </strong>
                    </td>

                    <td>
                      <strong>
                        {offer.partnerName}
                      </strong>

                      {offer.recommended && (
                        <span className="opportunitySectionEyebrow">
                          موصى به
                        </span>
                      )}
                    </td>

                    <td>
                      {offer.referenceNumber ??
                        "—"}
                    </td>

                    <td>
                      {formatMoney(
                        offer.totalAmount,
                        offer.currency,
                      )}
                    </td>

                    <td>
                      {Number(
                        offer.priceVariancePercentage,
                      ).toFixed(2)}
                      %
                    </td>

                    <td>
                      {offer.deliveryDays
                        ? `${offer.deliveryDays} يوم`
                        : "—"}
                    </td>

                    <td>
                      {offer.validityDays
                        ? `${offer.validityDays} يوم`
                        : "—"}
                    </td>

                    <td>
                      <span
                        className={
                          `opportunityEvaluationStatus ` +
                          `status-${offer.status.toLowerCase()}`
                        }
                      >
                        {offer.status}
                      </span>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}

      {canEvaluate && (
        <footer className="offerEvaluationManager__footer">
          <span>
            إكمال التقييم المالي لا يُعلن الفائز؛
            بل يجهز العروض لمرحلة توصية الترسية.
          </span>

          <div className="opportunityActionGroup">
            <button
              className="secondaryButton compactButton"
              disabled={
                pending || !canComplete
              }
              onClick={completeEvaluation}
              type="button"
            >
              {pending
                ? "جارٍ التنفيذ..."
                : "إكمال التقييم المالي"}
            </button>

            <button
              className="primaryButton compactButton"
              disabled={
                pending || !canRecommend
              }
              onClick={recommendAward}
              type="button"
            >
              {pending
                ? "جارٍ التنفيذ..."
                : "إنشاء توصية الترسية"}
            </button>
          </div>
        </footer>
      )}
    </section>
  );
}
