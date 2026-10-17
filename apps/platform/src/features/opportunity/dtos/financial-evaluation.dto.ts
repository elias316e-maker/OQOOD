export type FinancialEvaluationOfferResponse = {
  offerId: string;
  partnerName: string;
  referenceNumber: string | null;
  currency: string;
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
  deliveryDays: number | null;
  validityDays: number | null;
  paymentTerms: string | null;
  commercialNotes: string | null;
  priceVariancePercentage: string;
  rank: number;
  recommended: boolean;
  status: string;
};

export type FinancialEvaluationResponse = {
  opportunity: {
    id: string;
    number: string;
    title: string;
    currency: string;
    status: string;
  };
  offers: FinancialEvaluationOfferResponse[];
  summary: {
    eligibleOffersCount: number;
    evaluatedOffersCount: number;
    lowestOfferId: string | null;
    recommendedOfferId: string | null;
  };
};

export type GetFinancialEvaluationRequest = {
  workspaceId: string;
  actorUserId: string;
  opportunityId: string;
};

export type CompleteFinancialEvaluationRequest = {
  workspaceId: string;
  actorUserId: string;
  opportunityId: string;
};

export type RecommendFinancialAwardRequest = {
  workspaceId: string;
  actorUserId: string;
  opportunityId: string;
};
