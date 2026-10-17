import type {
  ArchiveOpportunityRequest,
  CreateOpportunityRequest,
  ListWorkspaceOpportunitiesRequest,
  OpportunityListResponse,
  OpportunityResponse,
  PublishOpportunityRequest,
  UpdateOpportunityRequest,
} from "../dtos";

export interface OpportunityApplicationService {
  create(
    request: CreateOpportunityRequest,
  ): Promise<OpportunityResponse>;

  update(
    request: UpdateOpportunityRequest,
  ): Promise<OpportunityResponse>;

  publish(
    request: PublishOpportunityRequest,
  ): Promise<OpportunityResponse>;

  archive(
    request: ArchiveOpportunityRequest,
  ): Promise<OpportunityResponse>;

  getById(input: {
    workspaceId: string;
    actorUserId: string;
    opportunityId: string;
  }): Promise<OpportunityResponse>;

  list(
    request: ListWorkspaceOpportunitiesRequest,
  ): Promise<OpportunityListResponse>;
}
