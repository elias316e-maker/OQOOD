"use client";

import styles from "./evaluation-tables.module.css";

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
  Badge,
  EmptyState,
  Button,
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
    <section className={styles.manager}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>
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

        <Badge tone="neutral">
          {evaluation.opportunity.status}
        </Badge>
      </header>

      <div className={styles.summary}>
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
        <EmptyState
          title="لا توجد عروض مؤهلة ماليًا"
          description="يجب قبول عرض واحد على الأقل فنيًا قبل بدء التقييم المالي."
        />
      ) : (
        <div className={styles.tableViewport} role="region" aria-label="ترتيب العروض المالية" tabIndex={0}>
          <table className={styles.table}>
              <caption>ترتيب العروض المالية</caption>
            <thead>
              <tr>
                <th scope="col">الترتيب</th>
                <th scope="col">المورد</th>
                <th scope="col">رقم العرض</th>
                <th scope="col">الإجمالي</th>
                <th scope="col">الانحراف السعري</th>
                <th scope="col">التسليم</th>
                <th scope="col">الصلاحية</th>
                <th scope="col">الحالة</th>
              </tr>
            </thead>

            <tbody>
              {evaluation.offers.map(
                (offer) => (
                  <tr
                    className={
                      offer.recommended
                        ? styles.selected
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
                        <Badge tone="success">
                          موصى به
                        </Badge>
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
                      <Badge tone="neutral">
                        {offer.status}
                      </Badge>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}

      {canEvaluate && (
        <footer className={styles.footer}>
          <span>
            إكمال التقييم المالي لا يُعلن الفائز؛
            بل يجهز العروض لمرحلة توصية الترسية.
          </span>

          <div className={styles.actions}>
            <Button
              variant="outline"
              disabled={
                pending || !canComplete
              }
              onClick={completeEvaluation}
              type="button"
            >
              {pending
                ? "جارٍ التنفيذ..."
                : "إكمال التقييم المالي"}
            </Button>

            <Button
              variant="primary"
              disabled={
                pending || !canRecommend
              }
              onClick={recommendAward}
              type="button"
            >
              {pending
                ? "جارٍ التنفيذ..."
                : "إنشاء توصية الترسية"}
            </Button>
          </div>
        </footer>
      )}
    </section>
  );
}
