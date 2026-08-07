export type OfferCriterionScoreResponse = {
  id: string;
  offerId: string;
  criterionId: string;
  criterionName: string;
  category: string;
  scoringMethod: string;
  weight: string;
  minimumScore: string | null;
  required: boolean;
  score: string | null;
  passed: boolean | null;
  notes: string | null;
  evaluatedById: string;
  evaluatedAt: string;
};

export type OfferEvaluationSummaryResponse = {
  offerId: string;
  totalWeightedScore: string;
  evaluatedWeight: string;
  totalActiveWeight: string;
  requiredCriteriaCount: number;
  passedRequiredCriteriaCount: number;
  failedRequiredCriteriaCount: number;
  completedCriteriaCount: number;
  totalCriteriaCount: number;
  complete: boolean;
  passed: boolean;
};

export type OfferEvaluationResponse = {
  offer: {
    id: string;
    opportunityId: string;
    partnerName: string;
    referenceNumber: string | null;
    status: string;
  };
  scores: OfferCriterionScoreResponse[];
  summary: OfferEvaluationSummaryResponse;
};

export type GetOfferEvaluationRequest = {
  workspaceId: string;
  actorUserId: string;
  offerId: string;
};

export type SaveOfferCriterionScoreRequest = {
  workspaceId: string;
  actorUserId: string;
  offerId: string;
  criterionId: string;
  score?: string | number | null;
  passed?: boolean | null;
  notes?: string | null;
};

export type CompleteOfferEvaluationRequest = {
  workspaceId: string;
  actorUserId: string;
  offerId: string;
};
