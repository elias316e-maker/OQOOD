import {
  Prisma,
  type PrismaClient,
} from "@/generated/prisma/client";

import {
  Permissions,
} from "@/lib/permissions";

import { prisma } from "@/lib/prisma";

import {
  PrismaOpportunityAuthorizationGateway,
  type OpportunityAuthorizationGateway,
} from "../authorization";

import type {
  ArchiveOpportunityRequest,
  CreateOpportunityRequest,
  ListWorkspaceOpportunitiesRequest,
  OpportunityListResponse,
  OpportunityResponse,
  PublishOpportunityRequest,
  UpdateOpportunityRequest,
} from "../dtos";

import {
  OpportunityArchivedError,
  OpportunityNotFoundError,
  OpportunityNumberAlreadyExistsError,
  OpportunityUpdateFieldsRequiredError,
  OpportunityValidationError,
  OpportunityInvalidStatusTransitionError,
  OpportunityPublishRequirementsError,
} from "../errors";

import {
  mapOpportunityResponse,
} from "../mappers";

import {
  PrismaOpportunityRepository,
  type OpportunityRepository,
} from "../repositories";

import {
  createOpportunitySchema,
  updateOpportunitySchema,
  publishOpportunitySchema,
  archiveOpportunitySchema,
  listWorkspaceOpportunitiesSchema,
} from "../validators";

import type {
  OpportunityApplicationService,
} from "./opportunity-application.service";

export type OpportunityTransactionRunner = Pick<
  PrismaClient,
  "$transaction"
>;

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

export class DefaultOpportunityApplicationService
  implements OpportunityApplicationService
{
  constructor(
    private readonly repository: OpportunityRepository =
      new PrismaOpportunityRepository(),

    private readonly authorization:
      OpportunityAuthorizationGateway =
        new PrismaOpportunityAuthorizationGateway(),

    private readonly transactionRunner:
      OpportunityTransactionRunner = prisma,
  ) {}

  async create(
    request: CreateOpportunityRequest,
  ): Promise<OpportunityResponse> {
    const validation =
      createOpportunitySchema.safeParse(request);

    if (!validation.success) {
      throw new OpportunityValidationError(
        validation.error.flatten(),
      );
    }

    const input = validation.data;

    try {
      const created =
        await this.transactionRunner.$transaction(
          async (transaction) => {
            const authorized =
              await this.authorization.authorize(
                transaction,
                {
                  workspaceId: input.workspaceId,
                  actorUserId: input.actorUserId,
                  permission:
                    Permissions.opportunities.create,
                  requireWriteAccess: true,
                },
              );

            const existing =
              await this.repository.findByNumber(
                transaction,
                authorized.workspaceId,
                input.number,
              );

            if (existing) {
              throw new OpportunityNumberAlreadyExistsError(
                input.number,
              );
            }

            const opportunity =
              await this.repository.create(
                transaction,
                {
                  workspaceId:
                    authorized.workspaceId,
                  projectId:
                    input.projectId ?? null,
                  number: input.number,
                  title: input.title,
                  description:
                    input.description ?? null,
                  type: input.type,
                  status: "DRAFT",
                  visibility:
                    input.visibility,
                  category:
                    input.category ?? null,
                  priority:
                    input.priority,
                  budget:
                    input.budget === null
                      ? null
                      : new Prisma.Decimal(
                          input.budget,
                        ),
                  currency:
                    request.currency
                      ? input.currency
                      : authorized.defaultCurrency,
                  issueDate:
                    input.issueDate ?? null,
                  closingDate:
                    input.closingDate ?? null,
                  createdById:
                    authorized.actorUserId,
                },
              );

            await this.repository.createAuditLog(
              transaction,
              {
                workspaceId:
                  authorized.workspaceId,
                actorUserId:
                  authorized.actorUserId,
                opportunityId:
                  opportunity.id,
                opportunityNumber:
                  opportunity.number,
                opportunityType:
                  opportunity.type,
                visibility:
                  opportunity.visibility,
              },
            );

            return opportunity;
          },
        );

      return mapOpportunityResponse(created);
    } catch (error) {
      if (
        error instanceof
        OpportunityNumberAlreadyExistsError
      ) {
        throw error;
      }

      if (isUniqueConstraintError(error)) {
        throw new OpportunityNumberAlreadyExistsError(
          input.number,
        );
      }

      throw error;
    }
  }

  async update(
    request: UpdateOpportunityRequest,
  ): Promise<OpportunityResponse> {
    const validation =
      updateOpportunitySchema.safeParse(request);

    if (!validation.success) {
      throw new OpportunityValidationError(
        validation.error.flatten(),
      );
    }

    const input = validation.data;

    const mutableFields = [
      "projectId",
      "title",
      "description",
      "type",
      "visibility",
      "category",
      "priority",
      "budget",
      "currency",
      "issueDate",
      "closingDate",
    ] as const;

    const hasField = (
      field: (typeof mutableFields)[number],
    ): boolean =>
      Object.prototype.hasOwnProperty.call(
        request,
        field,
      );

    const changedFields =
      mutableFields.filter(hasField);

    if (changedFields.length === 0) {
      throw new OpportunityUpdateFieldsRequiredError();
    }

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

          const existing =
            await this.repository.findById(
              transaction,
              authorized.workspaceId,
              input.opportunityId,
            );

          if (!existing) {
            throw new OpportunityNotFoundError(
              input.opportunityId,
            );
          }

          if (existing.status === "ARCHIVED") {
            throw new OpportunityArchivedError(
              existing.id,
            );
          }

          const issueDate =
            hasField("issueDate")
              ? input.issueDate
              : existing.issueDate;

          const closingDate =
            hasField("closingDate")
              ? input.closingDate
              : existing.closingDate;

          if (
            issueDate &&
            closingDate &&
            closingDate <= issueDate
          ) {
            throw new OpportunityValidationError({
              fieldErrors: {
                closingDate: [
                  "تاريخ الإغلاق يجب أن يكون بعد تاريخ الإصدار.",
                ],
              },
            });
          }

          const opportunity =
            await this.repository.update(
              transaction,
              authorized.workspaceId,
              existing.id,
              {
                ...(hasField("projectId")
                  ? {
                      projectId: input.projectId,
                    }
                  : {}),
                ...(hasField("title")
                  ? {
                      title: input.title,
                    }
                  : {}),
                ...(hasField("description")
                  ? {
                      description:
                        input.description,
                    }
                  : {}),
                ...(hasField("type")
                  ? {
                      type: input.type,
                    }
                  : {}),
                ...(hasField("visibility")
                  ? {
                      visibility:
                        input.visibility,
                    }
                  : {}),
                ...(hasField("category")
                  ? {
                      category: input.category,
                    }
                  : {}),
                ...(hasField("priority")
                  ? {
                      priority: input.priority,
                    }
                  : {}),
                ...(hasField("budget")
                  ? {
                      budget:
                        input.budget === null
                          ? null
                          : new Prisma.Decimal(
                              input.budget,
                            ),
                    }
                  : {}),
                ...(hasField("currency")
                  ? {
                      currency: input.currency,
                    }
                  : {}),
                ...(hasField("issueDate")
                  ? {
                      issueDate:
                        input.issueDate,
                    }
                  : {}),
                ...(hasField("closingDate")
                  ? {
                      closingDate:
                        input.closingDate,
                    }
                  : {}),
              },
            );

          if (!opportunity) {
            throw new OpportunityNotFoundError(
              input.opportunityId,
            );
          }

          await this.repository.createUpdateAuditLog(
            transaction,
            {
              workspaceId:
                authorized.workspaceId,
              actorUserId:
                authorized.actorUserId,
              opportunityId:
                opportunity.id,
              opportunityNumber:
                opportunity.number,
              changedFields: [
                ...changedFields,
              ],
            },
          );

          return opportunity;
        },
      );

    return mapOpportunityResponse(updated);
  }

  async publish(
    request: PublishOpportunityRequest,
  ): Promise<OpportunityResponse> {
    const validation =
      publishOpportunitySchema.safeParse(request);

    if (!validation.success) {
      throw new OpportunityValidationError(
        validation.error.flatten(),
      );
    }

    const input = validation.data;
    const publishedAt = new Date();

    const published =
      await this.transactionRunner.$transaction(
        async (transaction) => {
          const authorized =
            await this.authorization.authorize(
              transaction,
              {
                workspaceId: input.workspaceId,
                actorUserId: input.actorUserId,
                permission:
                  Permissions.opportunities.publish,
                requireWriteAccess: true,
              },
            );

          const existing =
            await this.repository.findById(
              transaction,
              authorized.workspaceId,
              input.opportunityId,
            );

          if (!existing) {
            throw new OpportunityNotFoundError(
              input.opportunityId,
            );
          }

          const publishableStatuses = new Set([
            "DRAFT",
            "APPROVED",
          ]);

          if (
            !publishableStatuses.has(
              existing.status,
            )
          ) {
            throw new OpportunityInvalidStatusTransitionError(
              existing.status,
              "PUBLISHED",
            );
          }

          const missingFields: string[] = [];

          if (!existing.title.trim()) {
            missingFields.push("title");
          }

          if (!existing.closingDate) {
            missingFields.push("closingDate");
          }

          if (
            existing.closingDate &&
            existing.closingDate <= publishedAt
          ) {
            missingFields.push(
              "closingDate.future",
            );
          }

          if (missingFields.length > 0) {
            throw new OpportunityPublishRequirementsError(
              missingFields,
            );
          }

          const opportunity =
            await this.repository.update(
              transaction,
              authorized.workspaceId,
              existing.id,
              {
                status: "PUBLISHED",
                publishedAt,
              },
            );

          if (!opportunity) {
            throw new OpportunityNotFoundError(
              input.opportunityId,
            );
          }

          await this.repository.createPublishAuditLog(
            transaction,
            {
              workspaceId:
                authorized.workspaceId,
              actorUserId:
                authorized.actorUserId,
              opportunityId:
                opportunity.id,
              opportunityNumber:
                opportunity.number,
              previousStatus:
                existing.status,
              publishedAt,
            },
          );

          return opportunity;
        },
      );

    return mapOpportunityResponse(published);
  }

  async archive(
    request: ArchiveOpportunityRequest,
  ): Promise<OpportunityResponse> {
    const validation =
      archiveOpportunitySchema.safeParse(request);

    if (!validation.success) {
      throw new OpportunityValidationError(
        validation.error.flatten(),
      );
    }

    const input = validation.data;
    const archivedAt = new Date();

    const archived =
      await this.transactionRunner.$transaction(
        async (transaction) => {
          const authorized =
            await this.authorization.authorize(
              transaction,
              {
                workspaceId: input.workspaceId,
                actorUserId: input.actorUserId,
                permission:
                  Permissions.opportunities.delete,
                requireWriteAccess: true,
              },
            );

          const existing =
            await this.repository.findById(
              transaction,
              authorized.workspaceId,
              input.opportunityId,
            );

          if (!existing) {
            throw new OpportunityNotFoundError(
              input.opportunityId,
            );
          }

          if (existing.status === "ARCHIVED") {
            throw new OpportunityInvalidStatusTransitionError(
              existing.status,
              "ARCHIVED",
            );
          }

          const opportunity =
            await this.repository.update(
              transaction,
              authorized.workspaceId,
              existing.id,
              {
                status: "ARCHIVED",
              },
            );

          if (!opportunity) {
            throw new OpportunityNotFoundError(
              input.opportunityId,
            );
          }

          await this.repository.createArchiveAuditLog(
            transaction,
            {
              workspaceId:
                authorized.workspaceId,
              actorUserId:
                authorized.actorUserId,
              opportunityId:
                opportunity.id,
              opportunityNumber:
                opportunity.number,
              previousStatus:
                existing.status,
              archivedAt,
            },
          );

          return opportunity;
        },
      );

    return mapOpportunityResponse(archived);
  }

  async getById(
    input: {
      workspaceId: string;
      actorUserId: string;
      opportunityId: string;
    },
  ): Promise<OpportunityResponse> {
    const result =
      await this.transactionRunner.$transaction(
        async (transaction) => {
          const authorized =
            await this.authorization.authorize(
              transaction,
              {
                workspaceId: input.workspaceId,
                actorUserId: input.actorUserId,
                permission:
                  Permissions.opportunities.read,
                requireWriteAccess: false,
              },
            );

          const opportunity =
            await this.repository.findById(
              transaction,
              authorized.workspaceId,
              input.opportunityId,
            );

          if (!opportunity) {
            throw new OpportunityNotFoundError(
              input.opportunityId,
            );
          }

          return opportunity;
        },
      );

    return mapOpportunityResponse(result);
  }

  async list(
    request: ListWorkspaceOpportunitiesRequest,
  ): Promise<OpportunityListResponse> {
    const validation =
      listWorkspaceOpportunitiesSchema.safeParse(
        request,
      );

    if (!validation.success) {
      throw new OpportunityValidationError(
        validation.error.flatten(),
      );
    }

    const input = validation.data;
    const page = input.page;
    const pageSize = input.pageSize;
    const limit = pageSize;
    const offset = (page - 1) * pageSize;

    const result =
      await this.transactionRunner.$transaction(
        async (transaction) => {
          const authorized =
            await this.authorization.authorize(
              transaction,
              {
                workspaceId: input.workspaceId,
                actorUserId: input.actorUserId,
                permission:
                  Permissions.opportunities.read,
                requireWriteAccess: false,
              },
            );

          const filters = {
            ...(input.status
              ? {
                  status: input.status,
                }
              : {}),
            ...(input.type
              ? {
                  type: input.type,
                }
              : {}),
            ...(input.visibility
              ? {
                  visibility:
                    input.visibility,
                }
              : {}),
            ...(input.search
              ? {
                  search: input.search,
                }
              : {}),
          };

          const [records, total] =
            await Promise.all([
              this.repository.listByWorkspace(
                transaction,
                {
                  workspaceId:
                    authorized.workspaceId,
                  filters,
                  limit,
                  offset,
                },
              ),

              this.repository.countByWorkspace(
                transaction,
                authorized.workspaceId,
                filters,
              ),
            ]);

          return {
            records,
            total,
          };
        },
      );

    return {
      items: result.records.map(
        mapOpportunityResponse,
      ),
      total: result.total,
      page,
      pageSize,
      totalPages:
        result.total === 0
          ? 0
          : Math.ceil(
              result.total / pageSize,
            ),
    };
  }

  protected getRepository(): OpportunityRepository {
    return this.repository;
  }

  protected getAuthorization():
    OpportunityAuthorizationGateway {
    return this.authorization;
  }

  protected getTransactionRunner():
    OpportunityTransactionRunner {
    return this.transactionRunner;
  }
}
