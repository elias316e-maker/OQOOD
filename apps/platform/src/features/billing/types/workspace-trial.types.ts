export type InitializeWorkspaceTrialInput = {
  workspaceId: string;
  ownerUserId: string;
  workspaceName: string;
  companyName: string;
  countryCode: string;
  currency: string;
  language: string;
};

export type InitializeWorkspaceTrialResult = {
  billingAccountId: string;
  subscriptionId: string;
  planId: string;
  planCode: string;
  planVersion: number;
  subscriptionStatus: "TRIALING";
  workspaceAccessState: "FULL";
  trialStartsAt: Date;
  trialEndsAt: Date;
  usageCounterIds: string[];
};
