import {
  Prisma,
} from "@/generated/prisma/client";

import {
  Permissions,
} from "@/lib/permissions";

import type {
  ProcurementAuthorizationGateway,
} from "../authorization";

import type {
  CreateProcurementRequestInput,
  GetProcurementRequestInput,
  ListProcurementRequestsInput,
  ProcurementRequestCommandInput,
  ProcurementRequestListResponse,
  ProcurementRequestResponse,
  UpdateProcurementRequestInput,
} from "../dtos";

import type {
  ProcurementRequestItemRepository,
  ProcurementRequestRepository,
} from "../repositories";

import {
  mapProcurementRequestResponse,
} from "../mappers";


import type {
  ProcurementApplicationService,
} from "./procurement-application.service";

import {
  ProcurementConflictError,
  ProcurementNotFoundError,
  ProcurementStateTransitionError,
  ProcurementValidationError,
} from "./procurement-errors";


export type ProcurementTransactionRunner = {
  $transaction<T>(
    callback: (
      transaction: Parameters<
        ProcurementRequestRepository["findById"]
      >[0],
    ) => Promise<T>,
  ): Promise<T>;
};



function isUniqueConstraintError(
  error: unknown,
): boolean {
  return (
    error instanceof
      Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export class DefaultProcurementApplicationService
  implements ProcurementApplicationService
{
  constructor(
    private readonly repository:
      ProcurementRequestRepository,
    private readonly itemRepository:
      ProcurementRequestItemRepository,
    private readonly authorization:
      ProcurementAuthorizationGateway,
    private readonly transactionRunner:
      ProcurementTransactionRunner,
  ) {}

  async create(
    request: CreateProcurementRequestInput,
  ): Promise<ProcurementRequestResponse> {
    try {
        return this.transactionRunner.$transaction(
          async (transaction) => {
            const authorized =
              await this.authorization.authorize(
                transaction,
                {
                  workspaceId:
                    request.workspaceId,
                  actorUserId:
                    request.actorUserId,
                  permission:
                    Permissions.procurement.create,
                  requireWriteAccess: true,
                },
              );

            const numberAlreadyExists =
              await this.repository.existsByNumber(
                transaction,
                authorized.workspaceId,
                request.number,
              );

            if (numberAlreadyExists) {
              throw new ProcurementConflictError(
                `Procurement request number already exists: ${request.number}`,
              );
            }

            const procurementRequest =
              await this.repository.create(
                transaction,
                {
                  workspaceId: authorized.workspaceId,
                  projectId: request.projectId ?? null,
                  number: request.number,
                  title: request.title,
                  description:
                    request.description ?? null,
                  status: "DRAFT",
                  priority:
                    request.priority ?? "NORMAL",
                  category:
                    request.category ?? null,
                  requiredByDate:
                    request.requiredByDate
                      ? new Date(
                          request.requiredByDate,
                        )
                      : null,
                  currency:
                    request.currency ??
                    authorized.defaultCurrency,
                  estimatedTotal: null,
                  requestedById:
                    request.requestedById,
                  assignedToId:
                    request.assignedToId ?? null,
                  createdById:
                    authorized.actorUserId,
                },
              );

            const itemInputs = (
              request.items ?? []
            ).map((item) => {
              const quantity =
                new Prisma.Decimal(item.quantity);

              const estimatedUnitPrice =
                item.estimatedUnitPrice === null ||
                item.estimatedUnitPrice === undefined
                  ? null
                  : new Prisma.Decimal(
                      item.estimatedUnitPrice,
                    );

              const estimatedTotal =
                estimatedUnitPrice === null
                  ? null
                  : quantity.mul(
                      estimatedUnitPrice,
                    );

              return {
                procurementRequestId:
                  procurementRequest.id,
                lineNumber: item.lineNumber,
                type: item.type,
                description: item.description,
                quantity,
                unit: item.unit,
                specification:
                  item.specification ?? null,
                estimatedUnitPrice,
                estimatedTotal,
                requiredByDate:
                  item.requiredByDate
                    ? new Date(
                        item.requiredByDate,
                      )
                    : null,
                deliveryLocation:
                  item.deliveryLocation ?? null,
                notes: item.notes ?? null,
              };
            });

            const createdItems =
              await this.itemRepository.createMany(
                transaction,
                itemInputs,
              );

            const estimatedTotals =
              itemInputs
                .map((item) => item.estimatedTotal)
                .filter(
                  (
                    value,
                  ): value is Prisma.Decimal =>
                    value !== null,
                );

            const requestEstimatedTotal =
              estimatedTotals.length === 0
                ? null
                : estimatedTotals.reduce(
                    (total, value) =>
                      total.add(value),
                    new Prisma.Decimal(0),
                  );

            const updatedProcurementRequest =
              await this.repository.update(
                transaction,
                request.workspaceId,
                procurementRequest.id,
                {
                  estimatedTotal:
                    requestEstimatedTotal,
                },
              );

            if (!updatedProcurementRequest) {
              throw new Error(
                "Created procurement request could not be updated.",
              );
            }

            await this.repository.createAuditLog(
              transaction,
              {
                workspaceId:
                  updatedProcurementRequest.workspaceId,
                actorUserId:
                  request.actorUserId,
                procurementRequestId:
                  updatedProcurementRequest.id,
                procurementRequestNumber:
                  updatedProcurementRequest.number,
                itemCount:
                  createdItems.length,
              },
            );

            return mapProcurementRequestResponse(
              updatedProcurementRequest,
              createdItems,
            );
          },
        );
    } catch (error) {
      if (
        error instanceof ProcurementConflictError
      ) {
        throw error;
      }

      if (isUniqueConstraintError(error)) {
        throw new ProcurementConflictError(
          "Procurement request number already exists.",
        );
      }

      throw error;
    }
  }
  async update(
    request: UpdateProcurementRequestInput,
  ): Promise<ProcurementRequestResponse> {
    const mutableFields = [
      "projectId",
      "title",
      "description",
      "priority",
      "category",
      "requiredByDate",
      "currency",
      "requestedById",
      "assignedToId",
      "items",
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
      throw new ProcurementValidationError(
        "At least one procurement request field is required.",
      );
    }

    return this.transactionRunner.$transaction(
      async (transaction) => {
        const authorized =
          await this.authorization.authorize(
            transaction,
            {
              workspaceId: request.workspaceId,
              actorUserId:
                request.actorUserId,
              permission:
                Permissions.procurement.update,
              requireWriteAccess: true,
            },
          );

        const existing =
          await this.repository.findById(
            transaction,
            authorized.workspaceId,
            request.procurementRequestId,
          );

        if (!existing) {
          throw new ProcurementNotFoundError();
        }

        if (
          existing.status !== "DRAFT" &&
          existing.status !==
            "CHANGES_REQUESTED"
        ) {
          throw new ProcurementStateTransitionError(
            `Procurement request cannot be edited while its status is ${existing.status}.`,
          );
        }

        let items =
          await this.itemRepository.findByRequestId(
            transaction,
            existing.id,
          );
        let estimatedTotal =
          existing.estimatedTotal;

        if (hasField("items")) {
          await this.itemRepository.deleteByRequestId(
            transaction,
            existing.id,
          );

          const itemInputs = (
            request.items ?? []
          ).map((item) => {
            const quantity =
              new Prisma.Decimal(item.quantity);
            const estimatedUnitPrice =
              item.estimatedUnitPrice === null ||
              item.estimatedUnitPrice ===
                undefined
                ? null
                : new Prisma.Decimal(
                    item.estimatedUnitPrice,
                  );

            return {
              procurementRequestId: existing.id,
              lineNumber: item.lineNumber,
              type: item.type,
              description: item.description,
              quantity,
              unit: item.unit,
              specification:
                item.specification ?? null,
              estimatedUnitPrice,
              estimatedTotal:
                estimatedUnitPrice === null
                  ? null
                  : quantity.mul(
                      estimatedUnitPrice,
                    ),
              requiredByDate:
                item.requiredByDate
                  ? new Date(
                      item.requiredByDate,
                    )
                  : null,
              deliveryLocation:
                item.deliveryLocation ?? null,
              notes: item.notes ?? null,
            };
          });

          items =
            await this.itemRepository.createMany(
              transaction,
              itemInputs,
            );

          const itemTotals = itemInputs
            .map((item) => item.estimatedTotal)
            .filter(
              (
                value,
              ): value is Prisma.Decimal =>
                value !== null,
            );

          estimatedTotal =
            itemTotals.length === 0
              ? null
              : itemTotals.reduce(
                  (total, value) =>
                    total.add(value),
                  new Prisma.Decimal(0),
                );
        }

        const updated =
          await this.repository.update(
            transaction,
            authorized.workspaceId,
            existing.id,
            {
              ...(hasField("projectId")
                ? {
                    projectId:
                      request.projectId,
                  }
                : {}),
              ...(hasField("title")
                ? {
                    title: request.title,
                  }
                : {}),
              ...(hasField("description")
                ? {
                    description:
                      request.description,
                  }
                : {}),
              ...(hasField("priority")
                ? {
                    priority:
                      request.priority,
                  }
                : {}),
              ...(hasField("category")
                ? {
                    category:
                      request.category,
                  }
                : {}),
              ...(hasField("requiredByDate")
                ? {
                    requiredByDate:
                      request.requiredByDate
                        ? new Date(
                            request.requiredByDate,
                          )
                        : null,
                  }
                : {}),
              ...(hasField("currency")
                ? {
                    currency:
                      request.currency,
                  }
                : {}),
              ...(hasField("requestedById")
                ? {
                    requestedById:
                      request.requestedById,
                  }
                : {}),
              ...(hasField("assignedToId")
                ? {
                    assignedToId:
                      request.assignedToId,
                  }
                : {}),
              ...(hasField("items")
                ? {
                    estimatedTotal,
                  }
                : {}),
            },
          );

        if (!updated) {
          throw new ProcurementNotFoundError();
        }

        await this.repository.createUpdateAuditLog(
          transaction,
          {
            workspaceId:
              authorized.workspaceId,
            actorUserId:
              authorized.actorUserId,
            procurementRequestId: updated.id,
            procurementRequestNumber:
              updated.number,
            changedFields: [
              ...changedFields,
            ],
            itemCount: items.length,
          },
        );

        return mapProcurementRequestResponse(
          updated,
          items,
        );
      },
    );
  }

  async submit(
    request: ProcurementRequestCommandInput,
  ): Promise<ProcurementRequestResponse> {
    return this.transactionRunner.$transaction(
      async (transaction) => {
        const authorized =
          await this.authorization.authorize(
            transaction,
            {
              workspaceId: request.workspaceId,
              actorUserId:
                request.actorUserId,
              permission:
                Permissions.procurement.update,
              requireWriteAccess: true,
            },
          );

        const existing =
          await this.repository.findById(
            transaction,
            authorized.workspaceId,
            request.procurementRequestId,
          );

        if (!existing) {
          throw new ProcurementNotFoundError();
        }

        if (
          existing.status !== "DRAFT" &&
          existing.status !==
            "CHANGES_REQUESTED"
        ) {
          throw new ProcurementStateTransitionError(
            `Procurement request cannot be submitted from ${existing.status}.`,
          );
        }

        const items =
          await this.itemRepository.findByRequestId(
            transaction,
            existing.id,
          );

        if (items.length === 0) {
          throw new ProcurementValidationError(
            "Procurement request must contain at least one item before submission.",
          );
        }

        const submittedAt = new Date();
        const submitted =
          await this.repository.update(
            transaction,
            authorized.workspaceId,
            existing.id,
            {
              status: "SUBMITTED",
            },
          );

        if (!submitted) {
          throw new ProcurementNotFoundError();
        }

        await this.repository.createSubmitAuditLog(
          transaction,
          {
            workspaceId:
              authorized.workspaceId,
            actorUserId:
              authorized.actorUserId,
            procurementRequestId:
              submitted.id,
            procurementRequestNumber:
              submitted.number,
            previousStatus: existing.status,
            itemCount: items.length,
            submittedAt,
          },
        );

        return mapProcurementRequestResponse(
          submitted,
          items,
        );
      },
    );
  }

  async startReview(
    request: ProcurementRequestCommandInput,
  ): Promise<ProcurementRequestResponse> {
    return this.transactionRunner.$transaction(
      async (transaction) => {
        const authorized =
          await this.authorization.authorize(
            transaction,
            {
              workspaceId: request.workspaceId,
              actorUserId:
                request.actorUserId,
              permission:
                Permissions.procurement.approve,
              requireWriteAccess: true,
            },
          );

        const existing =
          await this.repository.findById(
            transaction,
            authorized.workspaceId,
            request.procurementRequestId,
          );

        if (!existing) {
          throw new ProcurementNotFoundError();
        }

        if (existing.status !== "SUBMITTED") {
          throw new ProcurementStateTransitionError(
            `Procurement review cannot start from ${existing.status}.`,
          );
        }

        const items =
          await this.itemRepository.findByRequestId(
            transaction,
            existing.id,
          );
        const reviewStartedAt = new Date();
        const underReview =
          await this.repository.update(
            transaction,
            authorized.workspaceId,
            existing.id,
            {
              status: "UNDER_REVIEW",
            },
          );

        if (!underReview) {
          throw new ProcurementNotFoundError();
        }

        await this.repository.createStartReviewAuditLog(
          transaction,
          {
            workspaceId:
              authorized.workspaceId,
            actorUserId:
              authorized.actorUserId,
            procurementRequestId:
              underReview.id,
            procurementRequestNumber:
              underReview.number,
            previousStatus: existing.status,
            reviewStartedAt,
          },
        );

        return mapProcurementRequestResponse(
          underReview,
          items,
        );
      },
    );
  }

  async requestChanges(
    request: ProcurementRequestCommandInput,
  ): Promise<ProcurementRequestResponse> {
    const reason = request.reason?.trim();

    if (!reason) {
      throw new ProcurementValidationError(
        "A reason is required when requesting procurement changes.",
      );
    }

    return this.transactionRunner.$transaction(
      async (transaction) => {
        const authorized =
          await this.authorization.authorize(
            transaction,
            {
              workspaceId: request.workspaceId,
              actorUserId:
                request.actorUserId,
              permission:
                Permissions.procurement.approve,
              requireWriteAccess: true,
            },
          );

        const existing =
          await this.repository.findById(
            transaction,
            authorized.workspaceId,
            request.procurementRequestId,
          );

        if (!existing) {
          throw new ProcurementNotFoundError();
        }

        if (
          existing.status !== "UNDER_REVIEW"
        ) {
          throw new ProcurementStateTransitionError(
            `Procurement changes cannot be requested from ${existing.status}.`,
          );
        }

        const items =
          await this.itemRepository.findByRequestId(
            transaction,
            existing.id,
          );
        const changesRequestedAt = new Date();
        const changesRequested =
          await this.repository.update(
            transaction,
            authorized.workspaceId,
            existing.id,
            {
              status: "CHANGES_REQUESTED",
            },
          );

        if (!changesRequested) {
          throw new ProcurementNotFoundError();
        }

        await this.repository.createRequestChangesAuditLog(
          transaction,
          {
            workspaceId:
              authorized.workspaceId,
            actorUserId:
              authorized.actorUserId,
            procurementRequestId:
              changesRequested.id,
            procurementRequestNumber:
              changesRequested.number,
            previousStatus: existing.status,
            reason,
            changesRequestedAt,
          },
        );

        return mapProcurementRequestResponse(
          changesRequested,
          items,
        );
      },
    );
  }

  async approve(
    request: ProcurementRequestCommandInput,
  ): Promise<ProcurementRequestResponse> {
    return this.transactionRunner.$transaction(
      async (transaction) => {
        const authorized =
          await this.authorization.authorize(
            transaction,
            {
              workspaceId: request.workspaceId,
              actorUserId:
                request.actorUserId,
              permission:
                Permissions.procurement.approve,
              requireWriteAccess: true,
            },
          );

        const existing =
          await this.repository.findById(
            transaction,
            authorized.workspaceId,
            request.procurementRequestId,
          );

        if (!existing) {
          throw new ProcurementNotFoundError();
        }

        if (
          existing.status !== "UNDER_REVIEW"
        ) {
          throw new ProcurementStateTransitionError(
            `Procurement request cannot be approved from ${existing.status}.`,
          );
        }

        const items =
          await this.itemRepository.findByRequestId(
            transaction,
            existing.id,
          );
        const approvedAt = new Date();
        const approved =
          await this.repository.update(
            transaction,
            authorized.workspaceId,
            existing.id,
            {
              status: "APPROVED",
            },
          );

        if (!approved) {
          throw new ProcurementNotFoundError();
        }

        await this.repository.createApproveAuditLog(
          transaction,
          {
            workspaceId:
              authorized.workspaceId,
            actorUserId:
              authorized.actorUserId,
            procurementRequestId: approved.id,
            procurementRequestNumber:
              approved.number,
            previousStatus: existing.status,
            reason:
              request.reason?.trim() || null,
            approvedAt,
          },
        );

        return mapProcurementRequestResponse(
          approved,
          items,
        );
      },
    );
  }

  async reject(
    request: ProcurementRequestCommandInput,
  ): Promise<ProcurementRequestResponse> {
    const reason = request.reason?.trim();

    if (!reason) {
      throw new ProcurementValidationError(
        "A reason is required when rejecting a procurement request.",
      );
    }

    return this.transactionRunner.$transaction(
      async (transaction) => {
        const authorized =
          await this.authorization.authorize(
            transaction,
            {
              workspaceId: request.workspaceId,
              actorUserId:
                request.actorUserId,
              permission:
                Permissions.procurement.approve,
              requireWriteAccess: true,
            },
          );

        const existing =
          await this.repository.findById(
            transaction,
            authorized.workspaceId,
            request.procurementRequestId,
          );

        if (!existing) {
          throw new ProcurementNotFoundError();
        }

        if (
          existing.status !== "UNDER_REVIEW"
        ) {
          throw new ProcurementStateTransitionError(
            `Procurement request cannot be rejected from ${existing.status}.`,
          );
        }

        const items =
          await this.itemRepository.findByRequestId(
            transaction,
            existing.id,
          );
        const rejectedAt = new Date();
        const rejected =
          await this.repository.update(
            transaction,
            authorized.workspaceId,
            existing.id,
            {
              status: "REJECTED",
            },
          );

        if (!rejected) {
          throw new ProcurementNotFoundError();
        }

        await this.repository.createRejectAuditLog(
          transaction,
          {
            workspaceId:
              authorized.workspaceId,
            actorUserId:
              authorized.actorUserId,
            procurementRequestId: rejected.id,
            procurementRequestNumber:
              rejected.number,
            previousStatus: existing.status,
            reason,
            rejectedAt,
          },
        );

        return mapProcurementRequestResponse(
          rejected,
          items,
        );
      },
    );
  }

  async cancel(
    request: ProcurementRequestCommandInput,
  ): Promise<ProcurementRequestResponse> {
    return this.transactionRunner.$transaction(
      async (transaction) => {
        const authorized =
          await this.authorization.authorize(
            transaction,
            {
              workspaceId: request.workspaceId,
              actorUserId:
                request.actorUserId,
              permission:
                Permissions.procurement.update,
              requireWriteAccess: true,
            },
          );

        const existing =
          await this.repository.findById(
            transaction,
            authorized.workspaceId,
            request.procurementRequestId,
          );

        if (!existing) {
          throw new ProcurementNotFoundError();
        }

        const cancellableStatuses = [
          "DRAFT",
          "SUBMITTED",
          "UNDER_REVIEW",
          "CHANGES_REQUESTED",
        ] as const;

        if (
          !cancellableStatuses.includes(
            existing.status as
              (typeof cancellableStatuses)[number],
          )
        ) {
          throw new ProcurementStateTransitionError(
            `Procurement request cannot be cancelled from ${existing.status}.`,
          );
        }

        const items =
          await this.itemRepository.findByRequestId(
            transaction,
            existing.id,
          );
        const cancelledAt = new Date();
        const cancelled =
          await this.repository.update(
            transaction,
            authorized.workspaceId,
            existing.id,
            {
              status: "CANCELLED",
            },
          );

        if (!cancelled) {
          throw new ProcurementNotFoundError();
        }

        await this.repository.createCancelAuditLog(
          transaction,
          {
            workspaceId:
              authorized.workspaceId,
            actorUserId:
              authorized.actorUserId,
            procurementRequestId:
              cancelled.id,
            procurementRequestNumber:
              cancelled.number,
            previousStatus: existing.status,
            reason:
              request.reason?.trim() || null,
            cancelledAt,
          },
        );

        return mapProcurementRequestResponse(
          cancelled,
          items,
        );
      },
    );
  }

  async archive(
    request: ProcurementRequestCommandInput,
  ): Promise<ProcurementRequestResponse> {
    return this.transactionRunner.$transaction(
      async (transaction) => {
        const authorized =
          await this.authorization.authorize(
            transaction,
            {
              workspaceId: request.workspaceId,
              actorUserId:
                request.actorUserId,
              permission:
                Permissions.procurement.delete,
              requireWriteAccess: true,
            },
          );

        const existing =
          await this.repository.findById(
            transaction,
            authorized.workspaceId,
            request.procurementRequestId,
          );

        if (!existing) {
          throw new ProcurementNotFoundError();
        }

        const archivableStatuses = [
          "APPROVED",
          "REJECTED",
          "CANCELLED",
        ] as const;

        if (
          !archivableStatuses.includes(
            existing.status as
              (typeof archivableStatuses)[number],
          )
        ) {
          throw new ProcurementStateTransitionError(
            `Procurement request cannot be archived from ${existing.status}.`,
          );
        }

        const items =
          await this.itemRepository.findByRequestId(
            transaction,
            existing.id,
          );
        const archivedAt = new Date();
        const archived =
          await this.repository.update(
            transaction,
            authorized.workspaceId,
            existing.id,
            {
              status: "ARCHIVED",
            },
          );

        if (!archived) {
          throw new ProcurementNotFoundError();
        }

        await this.repository.createArchiveAuditLog(
          transaction,
          {
            workspaceId:
              authorized.workspaceId,
            actorUserId:
              authorized.actorUserId,
            procurementRequestId:
              archived.id,
            procurementRequestNumber:
              archived.number,
            previousStatus: existing.status,
            reason:
              request.reason?.trim() || null,
            archivedAt,
          },
        );

        return mapProcurementRequestResponse(
          archived,
          items,
        );
      },
    );
  }

  async getById(
    _request: GetProcurementRequestInput,
  ): Promise<ProcurementRequestResponse> {
    throw new Error("Not implemented.");
  }

  async list(
    _request: ListProcurementRequestsInput,
  ): Promise<ProcurementRequestListResponse> {
    throw new Error("Not implemented.");
  }
}
