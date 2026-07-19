import type { Prisma } from "@/generated/prisma/client";
import type {
  WorkspaceBootstrapBillingResult,
  WorkspaceBootstrapCoreResult,
  WorkspaceBootstrapInput,
} from "../types/workspace-bootstrap.types";
import type { WorkspaceIdentity } from "../utils/workspace-identity";

export type WorkspaceTransactionClient = Prisma.TransactionClient;

export type CreateWorkspaceRecordInput = {
  userId: string;
  identity: WorkspaceIdentity;
  data: WorkspaceBootstrapInput;
};

export type WorkspaceRecord = {
  id: string;
  code: string;
  slug: string;
  nameAr: string;
};

export type CompanyRecord = {
  id: string;
  nameAr: string;
  countryCode: string;
};

export interface WorkspaceRepository {
  userHasWorkspace(
    transaction: WorkspaceTransactionClient,
    userId: string,
  ): Promise<boolean>;

  createWorkspace(
    transaction: WorkspaceTransactionClient,
    input: CreateWorkspaceRecordInput,
  ): Promise<WorkspaceRecord>;

  createCompany(
    transaction: WorkspaceTransactionClient,
    workspaceId: string,
    input: WorkspaceBootstrapInput,
  ): Promise<CompanyRecord>;

  createOwnerMembership(
    transaction: WorkspaceTransactionClient,
    workspaceId: string,
    userId: string,
  ): Promise<{ id: string }>;

  createOwnerRole(
    transaction: WorkspaceTransactionClient,
    workspaceId: string,
  ): Promise<{ id: string }>;

  assignRoleToMember(
    transaction: WorkspaceTransactionClient,
    membershipId: string,
    roleId: string,
  ): Promise<void>;

  bootstrapWorkspaceCore(
    transaction: WorkspaceTransactionClient,
    userId: string,
    input: WorkspaceBootstrapInput,
    identity: WorkspaceIdentity,
  ): Promise<WorkspaceBootstrapCoreResult>;

  createBootstrapAuditLog(
    transaction: WorkspaceTransactionClient,
    input: {
      userId: string;
      core: WorkspaceBootstrapCoreResult;
      billing: WorkspaceBootstrapBillingResult;
    },
  ): Promise<void>;
}
