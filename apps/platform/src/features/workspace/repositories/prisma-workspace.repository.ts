import type {
  CompanyRecord,
  CreateWorkspaceRecordInput,
  WorkspaceRecord,
  WorkspaceRepository,
  WorkspaceTransactionClient,
} from "./workspace.repository";
import type {
  WorkspaceBootstrapBillingResult,
  WorkspaceBootstrapCoreResult,
  WorkspaceBootstrapInput,
} from "../types/workspace-bootstrap.types";
import type { WorkspaceIdentity } from "../utils/workspace-identity";

export class PrismaWorkspaceRepository
  implements WorkspaceRepository
{
  async userHasWorkspace(
    transaction: WorkspaceTransactionClient,
    userId: string,
  ): Promise<boolean> {
    const membership = await transaction.workspaceMember.findFirst({
      where: {
        userId,
        status: {
          in: ["ACTIVE", "INVITED"],
        },
      },
      select: {
        id: true,
      },
    });

    return membership !== null;
  }

  async createWorkspace(
    transaction: WorkspaceTransactionClient,
    input: CreateWorkspaceRecordInput,
  ): Promise<WorkspaceRecord> {
    return transaction.workspace.create({
      data: {
        code: input.identity.code,
        slug: input.identity.slug,
        nameAr: input.data.workspaceNameAr,
        nameEn: input.data.workspaceNameEn,
        countryCode: input.data.countryCode,
        timezone: input.data.timezone,
        defaultLanguage: input.data.defaultLanguage,
        defaultCurrency: input.data.defaultCurrency,
        status: "ACTIVE",
        createdById: input.userId,
      },
      select: {
        id: true,
        code: true,
        slug: true,
        nameAr: true,
      },
    });
  }

  async createCompany(
    transaction: WorkspaceTransactionClient,
    workspaceId: string,
    input: WorkspaceBootstrapInput,
  ): Promise<CompanyRecord> {
    return transaction.company.create({
      data: {
        workspaceId,
        nameAr: input.companyNameAr,
        nameEn: input.companyNameEn,
        commercialRegister: input.commercialRegister,
        countryCode: input.countryCode,
      },
      select: {
        id: true,
        nameAr: true,
        countryCode: true,
      },
    });
  }

  async createOwnerMembership(
    transaction: WorkspaceTransactionClient,
    workspaceId: string,
    userId: string,
  ): Promise<{ id: string }> {
    return transaction.workspaceMember.create({
      data: {
        workspaceId,
        userId,
        status: "ACTIVE",
      },
      select: {
        id: true,
      },
    });
  }

  async createOwnerRole(
    transaction: WorkspaceTransactionClient,
    workspaceId: string,
  ): Promise<{ id: string }> {
    return transaction.role.create({
      data: {
        workspaceId,
        code: "OWNER",
        name: "مالك مساحة العمل",
        description:
          "الدور النظامي للمالك المؤسس لمساحة العمل.",
        isSystem: true,
      },
      select: {
        id: true,
      },
    });
  }

  async assignRoleToMember(
    transaction: WorkspaceTransactionClient,
    membershipId: string,
    roleId: string,
  ): Promise<void> {
    await transaction.workspaceMemberRole.create({
      data: {
        workspaceMemberId: membershipId,
        roleId,
      },
    });
  }

  async bootstrapWorkspaceCore(
    transaction: WorkspaceTransactionClient,
    userId: string,
    input: WorkspaceBootstrapInput,
    identity: WorkspaceIdentity,
  ): Promise<WorkspaceBootstrapCoreResult> {
    const workspace = await this.createWorkspace(transaction, {
      userId,
      identity,
      data: input,
    });

    const company = await this.createCompany(
      transaction,
      workspace.id,
      input,
    );

    const ownerMembership =
      await this.createOwnerMembership(
        transaction,
        workspace.id,
        userId,
      );

    const ownerRole = await this.createOwnerRole(
      transaction,
      workspace.id,
    );

    await this.assignRoleToMember(
      transaction,
      ownerMembership.id,
      ownerRole.id,
    );

    return {
      workspace,
      company,
      ownerMembership,
      ownerRole,
    };
  }

  async createBootstrapAuditLog(
    transaction: WorkspaceTransactionClient,
    input: {
      userId: string;
      core: WorkspaceBootstrapCoreResult;
      billing: WorkspaceBootstrapBillingResult;
    },
  ): Promise<void> {
    await transaction.auditLog.create({
      data: {
        workspaceId: input.core.workspace.id,
        userId: input.userId,
        action: "workspace.bootstrap.completed",
        entityType: "Workspace",
        entityId: input.core.workspace.id,
        metadata: {
          workspaceCode: input.core.workspace.code,
          workspaceSlug: input.core.workspace.slug,
          companyId: input.core.company.id,
          membershipId: input.core.ownerMembership.id,
          ownerRoleId: input.core.ownerRole.id,
          billingAccountId: input.billing.billingAccountId,
          subscriptionId: input.billing.subscriptionId,
          planId: input.billing.planId,
          planCode: input.billing.planCode,
          planVersion: input.billing.planVersion,
          subscriptionStatus:
            input.billing.subscriptionStatus,
          workspaceAccessState:
            input.billing.workspaceAccessState,
          trialStartsAt:
            input.billing.trialStartsAt.toISOString(),
          trialEndsAt:
            input.billing.trialEndsAt.toISOString(),
          usageCounterIds: input.billing.usageCounterIds,
        },
      },
    });
  }
}
