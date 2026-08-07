export type CreateContractFromAwardRequest = {
  workspaceId: string;
  actorUserId: string;
  opportunityId: string;
};

export type CreateContractFromAwardResponse = {
  contractId: string;
  contractNumber: string;
  created: boolean;
};
