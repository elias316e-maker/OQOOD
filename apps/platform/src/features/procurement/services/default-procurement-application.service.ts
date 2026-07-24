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
    _request: UpdateProcurementRequestInput,
  ): Promise<ProcurementRequestResponse> {
    throw new Error("Not implemented.");
  }

  async submit(
    _request: ProcurementRequestCommandInput,
  ): Promise<ProcurementRequestResponse> {
    throw new Error("Not implemented.");
  }

  async startReview(
    _request: ProcurementRequestCommandInput,
  ): Promise<ProcurementRequestResponse> {
    throw new Error("Not implemented.");
  }

  async requestChanges(
    _request: ProcurementRequestCommandInput,
  ): Promise<ProcurementRequestResponse> {
    throw new Error("Not implemented.");
  }

  async approve(
    _request: ProcurementRequestCommandInput,
  ): Promise<ProcurementRequestResponse> {
    throw new Error("Not implemented.");
  }

  async reject(
    _request: ProcurementRequestCommandInput,
  ): Promise<ProcurementRequestResponse> {
    throw new Error("Not implemented.");
  }

  async cancel(
    _request: ProcurementRequestCommandInput,
  ): Promise<ProcurementRequestResponse> {
    throw new Error("Not implemented.");
  }

  async archive(
    _request: ProcurementRequestCommandInput,
  ): Promise<ProcurementRequestResponse> {
    throw new Error("Not implemented.");
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
