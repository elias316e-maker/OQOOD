export type AwardRecommendationRequest = {
  workspaceId: string;
  actorUserId: string;
  opportunityId: string;
  offerId: string;
  justification?: string | null;
};

export type AwardRecommendationResponse = {
  opportunity: {
    id: string;
    number: string;
    title: string;
    status: string;
  };

  awardedOffer: {
    offerId: string;
    partnerName: string;
    totalAmount: string;
    currency: string;
  };

  summary: {
    awardedAt: string;
    recommendedBy: string;
  };
};
