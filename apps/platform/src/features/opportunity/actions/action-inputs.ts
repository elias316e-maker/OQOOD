import type {
  ArchiveOpportunityRequest,
  CreateOpportunityRequest,
  ListWorkspaceOpportunitiesRequest,
  PublishOpportunityRequest,
  UpdateOpportunityRequest,
} from "../dtos";

export type CreateOpportunityActionInput = Omit<
  CreateOpportunityRequest,
  "workspaceId" | "actorUserId"
>;

export type UpdateOpportunityActionInput = Omit<
  UpdateOpportunityRequest,
  "workspaceId" | "actorUserId"
>;

export type PublishOpportunityActionInput = Omit<
  PublishOpportunityRequest,
  "workspaceId" | "actorUserId"
>;

export type ArchiveOpportunityActionInput = Omit<
  ArchiveOpportunityRequest,
  "workspaceId" | "actorUserId"
>;

export type GetOpportunityActionInput = {
  opportunityId: string;
};

export type ListWorkspaceOpportunitiesActionInput =
  Omit<
    ListWorkspaceOpportunitiesRequest,
    "workspaceId" | "actorUserId"
  >;
