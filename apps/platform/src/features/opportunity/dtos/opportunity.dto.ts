import type {
  OpportunityStatus,
  OpportunityType,
  OpportunityVisibility,
} from "@/generated/prisma/client";

export type CreateOpportunityRequest = {
  workspaceId: string;
  actorUserId: string;
  projectId?: string | null;
  number: string;
  title: string;
  description?: string | null;
  type: OpportunityType;
  visibility?: OpportunityVisibility;
  category?: string | null;
  priority?: string;
  budget?: string | number | null;
  currency?: string;
  issueDate?: Date | string | null;
  closingDate?: Date | string | null;
};

export type UpdateOpportunityRequest = {
  workspaceId: string;
  actorUserId: string;
  opportunityId: string;
  projectId?: string | null;
  title?: string;
  description?: string | null;
  type?: OpportunityType;
  visibility?: OpportunityVisibility;
  category?: string | null;
  priority?: string;
  budget?: string | number | null;
  currency?: string;
  issueDate?: Date | string | null;
  closingDate?: Date | string | null;
};

export type PublishOpportunityRequest = {
  workspaceId: string;
  actorUserId: string;
  opportunityId: string;
};

export type ArchiveOpportunityRequest = {
  workspaceId: string;
  actorUserId: string;
  opportunityId: string;
};

export type ListWorkspaceOpportunitiesRequest = {
  workspaceId: string;
  actorUserId: string;
  status?: OpportunityStatus;
  type?: OpportunityType;
  visibility?: OpportunityVisibility;
  search?: string;
  page?: number;
  pageSize?: number;
};

export type OpportunityResponse = {
  id: string;
  workspaceId: string;
  projectId: string | null;
  number: string;
  title: string;
  description: string | null;
  type: OpportunityType;
  status: OpportunityStatus;
  visibility: OpportunityVisibility;
  category: string | null;
  priority: string;
  budget: string | null;
  currency: string;
  issueDate: string | null;
  closingDate: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  closedAt: string | null;
};

export type OpportunitySummaryResponse = Pick<
  OpportunityResponse,
  | "id"
  | "workspaceId"
  | "number"
  | "title"
  | "type"
  | "status"
  | "visibility"
  | "priority"
  | "budget"
  | "currency"
  | "closingDate"
  | "createdAt"
>;

export type OpportunityListResponse = {
  items: OpportunitySummaryResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
