import {
  Prisma,
  type PrismaClient,
} from "@/generated/prisma/client";

import {
  Permissions,
} from "@/lib/permissions";

import {
  prisma,
} from "@/lib/prisma";

import {
  PrismaOpportunityAuthorizationGateway,
  type OpportunityAuthorizationGateway,
} from "../authorization";

import type {
  CreateOpportunityCriterionRequest,
  DeleteOpportunityCriterionRequest,
  ListOpportunityCriteriaRequest,
  OpportunityCriteriaListResponse,
  OpportunityCriterionResponse,
  UpdateOpportunityCriterionRequest,
} from "../dtos";

import {
  OpportunityArchivedError,
  OpportunityCriteriaWeightExceededError,
  OpportunityCriterionDuplicateNameError,
  OpportunityCriterionImmutableError,
  OpportunityCriterionNotFoundError,
  OpportunityNotFoundError,
  OpportunityValidationError,
} from "../errors";

import {
  PrismaOpportunityCriterionRepository,
  PrismaOpportunityRepository,
  type OpportunityCriterionRecord,
  type OpportunityCriterionRepository,
  type OpportunityRepository,
} from "../repositories";

import {
  createOpportunityCriterionSchema,
  deleteOpportunityCriterionSchema,
  listOpportunityCriteriaSchema,
  updateOpportunityCriterionSchema,
} from "../validators";

import type {
  OpportunityCriterionApplicationService,
} from "./opportunity-criterion-application.service";

type OpportunityCriterionTransactionRunner = Pick<
  PrismaClient,
  "$transaction"
>;

const mutableOpportunityStatuses = new Set([
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
]);

function mapCriterion(
  criterion: OpportunityCriterionRecord,
): OpportunityCriterionResponse {
  return {
    id: criterion.id,
    opportunityId: criterion.opportunityId,
    name: criterion.name,
    description: criterion.description,
    category: criterion.category,
    scoringMethod: criterion.scoringMethod,
    weight: criterion.weight.toString(),
    minimumScore:
      criterion.minimumScore?.toString() ?? null,
    required: criterion.required,
    active: criterion.active,
    displayOrder: criterion.displayOrder,
    createdAt: criterion.createdAt.toISOString(),
    updatedAt: criterion.updatedAt.toISOString(),
  };
}

function isUniqueConstraintError(
  error: unknown,
): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export class DefaultOpportunityCriterionApplicationService
  implements OpportunityCriterionApplicationService
{
  constructor(
    private readonly criterionRepository:
      OpportunityCriterionRepository =
        new PrismaOpportunityCriterionRepository(),

    private readonly opportunityRepository:
      OpportunityRepository =
        new PrismaOpportunityRepository(),

    private readonly authorization:
      OpportunityAuthorizationGateway =
        new PrismaOpportunityAuthorizationGateway(),

    private readonly transactionRunner:
      OpportunityCriterionTransactionRunner = prisma,
  ) {}

  async list(
    request: ListOpportunityCriteriaRequest,
  ): Promise<OpportunityCriteriaListResponse> {
    const validation =
      listOpportunityCriteriaSchema.safeParse(request);

    if (!validation.success) {
      throw new OpportunityValidationError(
        validation.error.flatten(),
      );
    }

    const input = validation.data;

    return this.transactionRunner.$transaction(
      async (transaction) => {
        const authorized =
          await this.authorization.authorize(
            transaction,
            {
              workspaceId: input.workspaceId,
              actorUserId: input.actorUserId,
              permission: Permissions.opportunities.read,
              requireWriteAccess: false,
            },
          );

        const opportunity =
          await this.opportunityRepository.findById(
            transaction,
            authorized.workspaceId,
            input.opportunityId,
          );

        if (!opportunity) {
          throw new OpportunityNotFoundError(
            input.opportunityId,
          );
        }

        const [criteria, totalWeight] =
          await Promise.all([
            this.criterionRepository.listByOpportunity(
              transaction,
              opportunity.id,
            ),
            this.criterionRepository.calculateTotalWeight(
              transaction,
              opportunity.id,
            ),
          ]);

        return {
          criteria: criteria.map(mapCriterion),
          totalWeight: totalWeight.toString(),
        };
      },
    );
  }

  async create(
    request: CreateOpportunityCriterionRequest,
  ): Promise<OpportunityCriterionResponse> {
    const validation =
      createOpportunityCriterionSchema.safeParse(request);

    if (!validation.success) {
      throw new OpportunityValidationError(
        validation.error.flatten(),
      );
    }

    const input = validation.data;

    try {
      const criterion =
        await this.transactionRunner.$transaction(
          async (transaction) => {
            const authorized =
              await this.authorization.authorize(
                transaction,
                {
                  workspaceId: input.workspaceId,
                  actorUserId: input.actorUserId,
                  permission:
                    Permissions.opportunities.update,
                  requireWriteAccess: true,
                },
              );

            const opportunity =
              await this.opportunityRepository.findById(
                transaction,
                authorized.workspaceId,
                input.opportunityId,
              );

            if (!opportunity) {
              throw new OpportunityNotFoundError(
                input.opportunityId,
              );
            }

            this.assertMutableOpportunity(
              opportunity.status,
              opportunity.id,
            );

            const duplicate =
              await this.criterionRepository.findByName(
                transaction,
                opportunity.id,
                input.name,
              );

            if (duplicate) {
              throw new OpportunityCriterionDuplicateNameError(
                input.name,
              );
            }

            const requestedWeight =
              new Prisma.Decimal(input.weight);

            if (input.active) {
              const currentWeight =
                await this.criterionRepository.calculateTotalWeight(
                  transaction,
                  opportunity.id,
                );

              const nextTotal =
                currentWeight.add(requestedWeight);

              this.assertWeightLimit(nextTotal);
            }

            const created =
              await this.criterionRepository.create(
                transaction,
                {
                  opportunityId: opportunity.id,
                  name: input.name,
                  description:
                    input.description ?? null,
                  category: input.category,
                  scoringMethod:
                    input.scoringMethod,
                  weight: requestedWeight,
                  minimumScore:
                    input.minimumScore === null
                      ? null
                      : new Prisma.Decimal(
                          input.minimumScore,
                        ),
                  required: input.required,
                  active: input.active,
                  displayOrder:
                    input.displayOrder,
                },
              );

            await this.criterionRepository.createAuditLog(
              transaction,
              {
                workspaceId:
                  authorized.workspaceId,
                actorUserId:
                  authorized.actorUserId,
                opportunityId:
                  opportunity.id,
                criterionId: created.id,
                criterionName: created.name,
              },
            );

            return created;
          },
        );

      return mapCriterion(criterion);
    } catch (error) {
      if (
        error instanceof
          OpportunityCriterionDuplicateNameError ||
        error instanceof
          OpportunityCriteriaWeightExceededError
      ) {
        throw error;
      }

      if (isUniqueConstraintError(error)) {
        throw new OpportunityCriterionDuplicateNameError(
          input.name,
        );
      }

      throw error;
    }
  }

  async update(
    request: UpdateOpportunityCriterionRequest,
  ): Promise<OpportunityCriterionResponse> {
    const validation =
      updateOpportunityCriterionSchema.safeParse(request);

    if (!validation.success) {
      throw new OpportunityValidationError(
        validation.error.flatten(),
      );
    }

    const input = validation.data;

    const mutableFields = [
      "name",
      "description",
      "category",
      "scoringMethod",
      "weight",
      "minimumScore",
      "required",
      "active",
      "displayOrder",
    ] as const;

    const hasField = (
      field: (typeof mutableFields)[number],
    ): boolean =>
      Object.prototype.hasOwnProperty.call(
        request,
        field,
      );

    try {
      const updated =
        await this.transactionRunner.$transaction(
          async (transaction) => {
            const authorized =
              await this.authorization.authorize(
                transaction,
                {
                  workspaceId: input.workspaceId,
                  actorUserId: input.actorUserId,
                  permission:
                    Permissions.opportunities.update,
                  requireWriteAccess: true,
                },
              );

            const opportunity =
              await this.opportunityRepository.findById(
                transaction,
                authorized.workspaceId,
                input.opportunityId,
              );

            if (!opportunity) {
              throw new OpportunityNotFoundError(
                input.opportunityId,
              );
            }

            this.assertMutableOpportunity(
              opportunity.status,
              opportunity.id,
            );

            const existing =
              await this.criterionRepository.findById(
                transaction,
                input.criterionId,
              );

            if (
              !existing ||
              existing.opportunityId !== opportunity.id
            ) {
              throw new OpportunityCriterionNotFoundError(
                input.criterionId,
              );
            }

            if (
              hasField("name") &&
              input.name !== existing.name
            ) {
              const duplicate =
                await this.criterionRepository.findByName(
                  transaction,
                  opportunity.id,
                  input.name!,
                );

              if (
                duplicate &&
                duplicate.id !== existing.id
              ) {
                throw new OpportunityCriterionDuplicateNameError(
                  input.name!,
                );
              }
            }

            const nextActive =
              hasField("active")
                ? input.active!
                : existing.active;

            const nextWeight =
              hasField("weight")
                ? new Prisma.Decimal(input.weight!)
                : existing.weight;

            if (nextActive) {
              const currentWeight =
                await this.criterionRepository.calculateTotalWeight(
                  transaction,
                  opportunity.id,
                );

              const weightWithoutExisting =
                existing.active
                  ? currentWeight.sub(existing.weight)
                  : currentWeight;

              this.assertWeightLimit(
                weightWithoutExisting.add(nextWeight),
              );
            }

            const changedFields =
              mutableFields.filter(hasField);

            const criterion =
              await this.criterionRepository.update(
                transaction,
                existing.id,
                {
                  ...(hasField("name")
                    ? { name: input.name }
                    : {}),
                  ...(hasField("description")
                    ? {
                        description:
                          input.description,
                      }
                    : {}),
                  ...(hasField("category")
                    ? {
                        category:
                          input.category,
                      }
                    : {}),
                  ...(hasField("scoringMethod")
                    ? {
                        scoringMethod:
                          input.scoringMethod,
                      }
                    : {}),
                  ...(hasField("weight")
                    ? {
                        weight: new Prisma.Decimal(
                          input.weight!,
                        ),
                      }
                    : {}),
                  ...(hasField("minimumScore")
                    ? {
                        minimumScore:
                          input.minimumScore === null
                            ? null
                            : new Prisma.Decimal(
                                input.minimumScore!,
                              ),
                      }
                    : {}),
                  ...(hasField("required")
                    ? {
                        required:
                          input.required,
                      }
                    : {}),
                  ...(hasField("active")
                    ? {
                        active:
                          input.active,
                      }
                    : {}),
                  ...(hasField("displayOrder")
                    ? {
                        displayOrder:
                          input.displayOrder,
                      }
                    : {}),
                },
              );

            if (!criterion) {
              throw new OpportunityCriterionNotFoundError(
                input.criterionId,
              );
            }

            await this.criterionRepository.createUpdateAuditLog(
              transaction,
              {
                workspaceId:
                  authorized.workspaceId,
                actorUserId:
                  authorized.actorUserId,
                opportunityId:
                  opportunity.id,
                criterionId: criterion.id,
                criterionName: criterion.name,
                changedFields: [
                  ...changedFields,
                ],
              },
            );

            return criterion;
          },
        );

      return mapCriterion(updated);
    } catch (error) {
      if (
        error instanceof
          OpportunityCriterionDuplicateNameError ||
        error instanceof
          OpportunityCriteriaWeightExceededError
      ) {
        throw error;
      }

      if (
        isUniqueConstraintError(error) &&
        input.name
      ) {
        throw new OpportunityCriterionDuplicateNameError(
          input.name,
        );
      }

      throw error;
    }
  }

  async delete(
    request: DeleteOpportunityCriterionRequest,
  ): Promise<void> {
    const validation =
      deleteOpportunityCriterionSchema.safeParse(request);

    if (!validation.success) {
      throw new OpportunityValidationError(
        validation.error.flatten(),
      );
    }

    const input = validation.data;

    await this.transactionRunner.$transaction(
      async (transaction) => {
        const authorized =
          await this.authorization.authorize(
            transaction,
            {
              workspaceId: input.workspaceId,
              actorUserId: input.actorUserId,
              permission:
                Permissions.opportunities.update,
              requireWriteAccess: true,
            },
          );

        const opportunity =
          await this.opportunityRepository.findById(
            transaction,
            authorized.workspaceId,
            input.opportunityId,
          );

        if (!opportunity) {
          throw new OpportunityNotFoundError(
            input.opportunityId,
          );
        }

        this.assertMutableOpportunity(
          opportunity.status,
          opportunity.id,
        );

        const criterion =
          await this.criterionRepository.findById(
            transaction,
            input.criterionId,
          );

        if (
          !criterion ||
          criterion.opportunityId !== opportunity.id
        ) {
          throw new OpportunityCriterionNotFoundError(
            input.criterionId,
          );
        }

        await this.criterionRepository.createDeleteAuditLog(
          transaction,
          {
            workspaceId:
              authorized.workspaceId,
            actorUserId:
              authorized.actorUserId,
            opportunityId:
              opportunity.id,
            criterionId: criterion.id,
            criterionName: criterion.name,
          },
        );

        await this.criterionRepository.delete(
          transaction,
          criterion.id,
        );
      },
    );
  }

  private assertWeightLimit(
    totalWeight: Prisma.Decimal,
  ): void {
    if (totalWeight.greaterThan(100)) {
      throw new OpportunityCriteriaWeightExceededError(
        totalWeight.toString(),
      );
    }
  }

  private assertMutableOpportunity(
    status: string,
    opportunityId: string,
  ): void {
    if (status === "ARCHIVED") {
      throw new OpportunityArchivedError(
        opportunityId,
      );
    }

    if (!mutableOpportunityStatuses.has(status)) {
      throw new OpportunityCriterionImmutableError(
        status,
      );
    }
  }
}
