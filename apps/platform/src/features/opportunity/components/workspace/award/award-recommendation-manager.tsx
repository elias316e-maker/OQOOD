"use client";

import { useState, useTransition } from "react";

import {
  awardOpportunityAction,
} from "../../../actions";

import {
  Alert,
} from "@oqood/design-system";

type AwardRecommendationManagerProps = {
  opportunityId: string;
  offerId: string;
  partnerName: string;
  canAward: boolean;
};

export function AwardRecommendationManager({
  opportunityId,
  offerId,
  partnerName,
  canAward,
}: AwardRecommendationManagerProps) {
  const [pending, startTransition] =
    useTransition();

  const [message, setMessage] =
    useState<string | null>(null);

  async function award(): Promise<void> {
    setMessage(null);

    const confirmed = window.confirm(
      `هل تريد اعتماد ترسية المنافسة على ${partnerName}؟`,
    );

    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      const result =
        await awardOpportunityAction({
          opportunityId,
          offerId,
        });

      setMessage(
        result.message ??
          (result.success
            ? "تم اعتماد الترسية بنجاح."
            : "تعذر اعتماد الترسية."),
      );

      if (result.success) {
        window.location.reload();
      }
    });
  }

  return (
    <div className="opportunityAwardRecommendation">
      {message && (
        <Alert
           tone="info"
          role="status"
        >
          {message}
        </Alert>
      )}

      <button
        type="button"
        className="primaryButton compactButton"
        disabled={
          pending || !canAward
        }
        onClick={award}
      >
        {pending
          ? "جارٍ اعتماد الترسية..."
          : "اعتماد العرض الفائز"}
      </button>
    </div>
  );
}
