import type {
  OpportunityStatus,
  OpportunityType,
  OpportunityVisibility,
  Prisma,
} from "@/generated/prisma/client";

export type OpportunityTransactionClient =
  Prisma.TransactionClient;

export type OpportunityRecord = {
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
  budget: Prisma.Decimal | null;
  currency: string;
  issueDate: Date | null;
  closingDate: Date | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
  closedAt: Date | null;
};

export type OpportunityListFilters = {
  status?: OpportunityStatus;
  type?: OpportunityType;
  visibility?: OpportunityVisibility;
  search?: string;
};

export type OpportunityListInput = {
  workspaceId: string;
  filters?: OpportunityListFilters;
  limit?: number;
  offset?: number;
};

export type CreateOpportunityRecordInput = {
  workspaceId: string;
  projectId?: string | null;
  number: string;
  title: string;
  description?: string | null;
  type: OpportunityType;
  status?: OpportunityStatus;
  visibility?: OpportunityVisibility;
  category?: string | null;
  priority?: string;
  budget?: Prisma.Decimal | null;
  currency?: string;
  issueDate?: Date | null;
  closingDate?: Date | null;
  createdById: string;
};

export type UpdateOpportunityRecordInput = {
  projectId?: string | null;
  title?: string;
  description?: string | null;
  type?: OpportunityType;
  status?: OpportunityStatus;
  visibility?: OpportunityVisibility;
  category?: string | null;
  priority?: string;
  budget?: Prisma.Decimal | null;
  currency?: string;
  issueDate?: Date | null;
  closingDate?: Date | null;
  publishedAt?: Date | null;
  closedAt?: Date | null;
};

export type CreateOpportunityAuditInput = {
  workspaceId: string;
  actorUserId: string;
  opportunityId: string;
  opportunityNumber: string;
  opportunityType: OpportunityType;
  visibility: OpportunityVisibility;
};


export type UpdateOpportunityAuditInput = {
  workspaceId: string;
  actorUserId: string;
  opportunityId: string;
  opportunityNumber: string;
  changedFields: string[];
};


export type PublishOpportunityAuditInput = {
  workspaceId: string;
  actorUserId: string;
  opportunityId: string;
  opportunityNumber: string;
  previousStatus: OpportunityStatus;
  publishedAt: Date;
};


export type ArchiveOpportunityAuditInput = {
  workspaceId: string;
  actorUserId: string;
  opportunityId: string;
  opportunityNumber: string;
  previousStatus: OpportunityStatus;
  archivedAt: Date;
};

export interface OpportunityRepository {
  findById(
    transaction: OpportunityTransactionClient,
    workspaceId: string,
    opportunityId: string,
  ): Promise<OpportunityRecord | null>;

  findByNumber(
    transaction: OpportunityTransactionClient,
    workspaceId: string,
    number: string,
  ): Promise<OpportunityRecord | null>;

  listByWorkspace(
    transaction: OpportunityTransactionClient,
    input: OpportunityListInput,
  ): Promise<OpportunityRecord[]>;

  countByWorkspace(
    transaction: OpportunityTransactionClient,
    workspaceId: string,
    filters?: OpportunityListFilters,
  ): Promise<number>;

  create(
    transaction: OpportunityTransactionClient,
    input: CreateOpportunityRecordInput,
  ): Promise<OpportunityRecord>;

  update(
    transaction: OpportunityTransactionClient,
    workspaceId: string,
    opportunityId: string,
    input: UpdateOpportunityRecordInput,
  ): Promise<OpportunityRecord | null>;

  createAuditLog(
    transaction: OpportunityTransactionClient,
    input: CreateOpportunityAuditInput,
  ): Promise<void>;


  createUpdateAuditLog(
    transaction: OpportunityTransactionClient,
    input: UpdateOpportunityAuditInput,
  ): Promise<void>;


  createPublishAuditLog(
    transaction: OpportunityTransactionClient,
    input: PublishOpportunityAuditInput,
  ): Promise<void>;


  createArchiveAuditLog(
    transaction: OpportunityTransactionClient,
    input: ArchiveOpportunityAuditInput,
  ): Promise<void>;
}
