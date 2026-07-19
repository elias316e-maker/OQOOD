import {
  DefaultBillingInitializer,
  type BillingInitializer,
} from "@/features/billing";
import { prisma } from "@/lib/prisma";
import {
  PrismaWorkspaceRepository,
  type WorkspaceRepository,
} from "../repositories";
import type {
  WorkspaceBootstrapBillingResult,
  WorkspaceBootstrapInput,
  WorkspaceBootstrapResult,
} from "../types";
import { generateWorkspaceIdentity } from "../utils";
import { validateWorkspaceBootstrapInput } from "../validators";
import {
  WorkspaceAlreadyExistsError,
  WorkspaceIdentityGenerationError,
  type WorkspaceBootstrapService,
} from "./workspace-bootstrap.service";

const MAX_IDENTITY_ATTEMPTS = 3;

function isWorkspaceIdentityConflict(error: unknown): boolean {
  if (
    typeof error !== "object" ||
    error === null ||
    !("code" in error) ||
    error.code !== "P2002"
  ) {
    return false;
  }

  const meta =
    "meta" in error &&
    typeof error.meta === "object" &&
    error.meta !== null
      ? error.meta
      : null;

  if (!meta || !("target" in meta)) {
    return false;
  }

  const target = meta.target;

  const fields = Array.isArray(target)
    ? target.map(String)
    : typeof target === "string"
      ? [target]
      : [];

  return fields.some(
    (field) =>
      field.includes("code") || field.includes("slug"),
  );
}

export class DefaultWorkspaceBootstrapService
  implements WorkspaceBootstrapService
{
  constructor(
    private readonly repository: WorkspaceRepository =
      new PrismaWorkspaceRepository(),
    private readonly billingInitializer: BillingInitializer =
      new DefaultBillingInitializer(),
  ) {}

  async execute(
    userId: string,
    input: WorkspaceBootstrapInput,
  ): Promise<WorkspaceBootstrapResult> {
    const normalizedUserId = userId.trim();

    if (!normalizedUserId) {
      throw new Error("معرف المستخدم مطلوب.");
    }

    const validation = validateWorkspaceBootstrapInput(input);

    if (!validation.success) {
      const error = new Error(
        "بيانات إنشاء مساحة العمل غير صالحة.",
      );

      Object.assign(error, {
        name: "WorkspaceBootstrapValidationError",
        validationErrors: validation.errors,
      });

      throw error;
    }

    for (
      let attempt = 1;
      attempt <= MAX_IDENTITY_ATTEMPTS;
      attempt += 1
    ) {
      const identity = generateWorkspaceIdentity({
        workspaceNameAr: validation.data.workspaceNameAr,
        workspaceNameEn: validation.data.workspaceNameEn,
      });

      try {
        return await prisma.$transaction(
          async (transaction) => {
            const hasWorkspace =
              await this.repository.userHasWorkspace(
                transaction,
                normalizedUserId,
              );

            if (hasWorkspace) {
              throw new WorkspaceAlreadyExistsError();
            }

            const core =
              await this.repository.bootstrapWorkspaceCore(
                transaction,
                normalizedUserId,
                validation.data,
                identity,
              );

            const billingResult =
              await this.billingInitializer.initialize(
                transaction,
                {
                  workspaceId: core.workspace.id,
                  ownerUserId: normalizedUserId,
                  workspaceName: core.workspace.nameAr,
                  companyName: core.company.nameAr,
                  countryCode: core.company.countryCode,
                  currency: validation.data.defaultCurrency,
                  language: validation.data.defaultLanguage,
                },
              );

            const billing: WorkspaceBootstrapBillingResult = {
              billingAccountId:
                billingResult.billingAccountId,
              subscriptionId: billingResult.subscriptionId,
              planId: billingResult.planId,
              planCode: billingResult.planCode,
              planVersion: billingResult.planVersion,
              subscriptionStatus:
                billingResult.subscriptionStatus,
              workspaceAccessState:
                billingResult.workspaceAccessState,
              trialStartsAt: billingResult.trialStartsAt,
              trialEndsAt: billingResult.trialEndsAt,
              usageCounterIds:
                billingResult.usageCounterIds,
            };

            await this.repository.createBootstrapAuditLog(
              transaction,
              {
                userId: normalizedUserId,
                core,
                billing,
              },
            );

            return {
              workspace: core.workspace,
              company: core.company,
              ownerMembership: core.ownerMembership,
              ownerRole: core.ownerRole,
              billing,
            };
          },
        );
      } catch (error) {
        if (error instanceof WorkspaceAlreadyExistsError) {
          throw error;
        }

        if (
          isWorkspaceIdentityConflict(error) &&
          attempt < MAX_IDENTITY_ATTEMPTS
        ) {
          continue;
        }

        if (isWorkspaceIdentityConflict(error)) {
          throw new WorkspaceIdentityGenerationError();
        }

        throw error;
      }
    }

    throw new WorkspaceIdentityGenerationError();
  }
}
