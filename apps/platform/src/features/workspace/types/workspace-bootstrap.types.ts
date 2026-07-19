export type WorkspaceBootstrapInput = {
  workspaceNameAr: string;
  workspaceNameEn?: string;
  companyNameAr: string;
  companyNameEn?: string;
  commercialRegister?: string;
  countryCode: string;
  timezone: string;
  defaultLanguage: string;
  defaultCurrency: string;
};

export type WorkspaceBootstrapCoreResult = {
  workspace: {
    id: string;
    code: string;
    slug: string;
    nameAr: string;
  };
  company: {
    id: string;
    nameAr: string;
    countryCode: string;
  };
  ownerMembership: {
    id: string;
  };
  ownerRole: {
    id: string;
  };
};

export type WorkspaceBootstrapBillingResult = {
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

export type WorkspaceBootstrapResult = {
  workspace: WorkspaceBootstrapCoreResult["workspace"];
  company: WorkspaceBootstrapCoreResult["company"];
  ownerMembership: WorkspaceBootstrapCoreResult["ownerMembership"];
  ownerRole: WorkspaceBootstrapCoreResult["ownerRole"];
  billing: WorkspaceBootstrapBillingResult;
};
