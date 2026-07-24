import type {
  OpportunityListResponse,
  OpportunityResponse,
  OpportunitySummaryResponse,
} from "../dtos";
import type { OpportunityRecord } from "../repositories";

function toIsoString(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

export function mapOpportunityResponse(
  record: OpportunityRecord,
): OpportunityResponse {
  return {
    id: record.id,
    workspaceId: record.workspaceId,
    projectId: record.projectId,
    number: record.number,
    title: record.title,
    description: record.description,
    type: record.type,
    status: record.status,
    visibility: record.visibility,
    category: record.category,
    priority: record.priority,
    budget: record.budget?.toString() ?? null,
    currency: record.currency,
    issueDate: toIsoString(record.issueDate),
    closingDate: toIsoString(record.closingDate),
    createdById: record.createdById,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    publishedAt: toIsoString(record.publishedAt),
    closedAt: toIsoString(record.closedAt),
  };
}

export function mapOpportunitySummaryResponse(
  record: OpportunityRecord,
): OpportunitySummaryResponse {
  const response = mapOpportunityResponse(record);

  return {
    id: response.id,
    workspaceId: response.workspaceId,
    number: response.number,
    title: response.title,
    type: response.type,
    status: response.status,
    visibility: response.visibility,
    priority: response.priority,
    budget: response.budget,
    currency: response.currency,
    closingDate: response.closingDate,
    createdAt: response.createdAt,
  };
}

export function mapOpportunityListResponse(input: {
  records: OpportunityRecord[];
  total: number;
  page: number;
  pageSize: number;
}): OpportunityListResponse {
  return {
    items: input.records.map(
      mapOpportunitySummaryResponse,
    ),
    total: input.total,
    page: input.page,
    pageSize: input.pageSize,
    totalPages:
      input.total === 0
        ? 0
        : Math.ceil(input.total / input.pageSize),
  };
}
