import "dotenv/config";

import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import {
  PrismaProcurementAuthorizationGateway,
} from "../authorization";
import {
  PrismaProcurementRequestItemRepository,
  PrismaProcurementRequestRepository,
  type ApproveProcurementRequestAuditInput,
  type ArchiveProcurementRequestAuditInput,
  type CancelProcurementRequestAuditInput,
  type CreateProcurementRequestAuditInput,
  type ProcurementTransactionClient,
  type RejectProcurementRequestAuditInput,
  type RequestProcurementChangesAuditInput,
  type StartProcurementReviewAuditInput,
  type SubmitProcurementRequestAuditInput,
  type UpdateProcurementRequestAuditInput,
} from "../repositories";
import {
  DefaultProcurementApplicationService,
  ProcurementConflictError,
  ProcurementNotFoundError,
  ProcurementStateTransitionError,
  ProcurementValidationError,
} from "../services";

import {
  Permissions,
  PermissionDeniedError,
} from "@/lib/permissions";
import {
  prisma,
} from "@/lib/prisma";
import {
  createPermissionTestContext,
  createWorkspaceTestContext,
  type WorkspaceTestContext,
} from "@/testing";

class ThrowingProcurementAuditRepository
  extends PrismaProcurementRequestRepository
{
  override async createAuditLog(
    transaction: ProcurementTransactionClient,
    input: CreateProcurementRequestAuditInput,
  ): Promise<void> {
    void transaction;
    void input;
    throw new Error(
      "Simulated procurement audit failure.",
    );
  }
}

class ThrowingProcurementUpdateAuditRepository
  extends PrismaProcurementRequestRepository
{
  override async createUpdateAuditLog(
    transaction: ProcurementTransactionClient,
    input: UpdateProcurementRequestAuditInput,
  ): Promise<void> {
    void transaction;
    void input;
    throw new Error(
      "Simulated procurement update audit failure.",
    );
  }
}

class ThrowingProcurementSubmitAuditRepository
  extends PrismaProcurementRequestRepository
{
  override async createSubmitAuditLog(
    transaction: ProcurementTransactionClient,
    input: SubmitProcurementRequestAuditInput,
  ): Promise<void> {
    void transaction;
    void input;
    throw new Error(
      "Simulated procurement submit audit failure.",
    );
  }
}

class ThrowingProcurementStartReviewAuditRepository
  extends PrismaProcurementRequestRepository
{
  override async createStartReviewAuditLog(
    transaction: ProcurementTransactionClient,
    input: StartProcurementReviewAuditInput,
  ): Promise<void> {
    void transaction;
    void input;
    throw new Error(
      "Simulated procurement review audit failure.",
    );
  }
}

class ThrowingProcurementRequestChangesAuditRepository
  extends PrismaProcurementRequestRepository
{
  override async createRequestChangesAuditLog(
    transaction: ProcurementTransactionClient,
    input: RequestProcurementChangesAuditInput,
  ): Promise<void> {
    void transaction;
    void input;
    throw new Error(
      "Simulated procurement changes audit failure.",
    );
  }
}

class ThrowingProcurementApproveAuditRepository
  extends PrismaProcurementRequestRepository
{
  override async createApproveAuditLog(
    transaction: ProcurementTransactionClient,
    input: ApproveProcurementRequestAuditInput,
  ): Promise<void> {
    void transaction;
    void input;
    throw new Error(
      "Simulated procurement approval audit failure.",
    );
  }
}

class ThrowingProcurementRejectAuditRepository
  extends PrismaProcurementRequestRepository
{
  override async createRejectAuditLog(
    transaction: ProcurementTransactionClient,
    input: RejectProcurementRequestAuditInput,
  ): Promise<void> {
    void transaction;
    void input;
    throw new Error(
      "Simulated procurement rejection audit failure.",
    );
  }
}

class ThrowingProcurementCancelAuditRepository
  extends PrismaProcurementRequestRepository
{
  override async createCancelAuditLog(
    transaction: ProcurementTransactionClient,
    input: CancelProcurementRequestAuditInput,
  ): Promise<void> {
    void transaction;
    void input;
    throw new Error(
      "Simulated procurement cancellation audit failure.",
    );
  }
}

class ThrowingProcurementArchiveAuditRepository
  extends PrismaProcurementRequestRepository
{
  override async createArchiveAuditLog(
    transaction: ProcurementTransactionClient,
    input: ArchiveProcurementRequestAuditInput,
  ): Promise<void> {
    void transaction;
    void input;
    throw new Error(
      "Simulated procurement archive audit failure.",
    );
  }
}

describe(
  "DefaultProcurementApplicationService create and update",
  () => {
    let context: WorkspaceTestContext;
    let billingAccountId: string;

    const requestRepository =
      new PrismaProcurementRequestRepository();
    const itemRepository =
      new PrismaProcurementRequestItemRepository();
    const authorization =
      new PrismaProcurementAuthorizationGateway();

    beforeAll(async () => {
      context =
        await createWorkspaceTestContext({
          prefix: "procurement-service",
          userName:
            "Procurement Service Test User",
          workspaceNameEn:
            "Procurement Service Test Workspace",
        });

      const plan =
        await prisma.plan.findFirstOrThrow({
          where: {
            status: "ACTIVE",
          },
          select: {
            id: true,
          },
        });

      const billingAccount =
        await prisma.billingAccount.create({
          data: {
            workspaceId: context.workspaceId,
            legalName:
              "Procurement Service Test Company",
            countryCode: "SA",
            currency: "SAR",
            language: "ar",
          },
          select: {
            id: true,
          },
        });

      billingAccountId = billingAccount.id;

      await prisma.subscription.create({
        data: {
          workspaceId: context.workspaceId,
          billingAccountId,
          planId: plan.id,
          initializationKey:
            `procurement-service:${context.uniqueId}`,
          status: "ACTIVE",
          accessState: "FULL",
          source: "MANUAL",
          currentPeriodStartsAt: new Date(),
          currentPeriodEndsAt: new Date(
            Date.now() +
              30 * 24 * 60 * 60 * 1000,
          ),
        },
      });

      await createPermissionTestContext(
        context.roleId,
      ).grantPermission(
        Permissions.procurement.create,
      );
      await createPermissionTestContext(
        context.roleId,
      ).grantPermission(
        Permissions.procurement.update,
      );
      await createPermissionTestContext(
        context.roleId,
      ).grantPermission(
        Permissions.procurement.approve,
      );
      await createPermissionTestContext(
        context.roleId,
      ).grantPermission(
        Permissions.procurement.delete,
      );
      await createPermissionTestContext(
        context.roleId,
      ).grantPermission(
        Permissions.procurement.read,
      );
    });

    afterAll(async () => {
      await prisma.procurementRequestItem.deleteMany({
        where: {
          procurementRequest: {
            workspaceId: context.workspaceId,
          },
        },
      });
      await prisma.procurementRequest.deleteMany({
        where: {
          workspaceId: context.workspaceId,
        },
      });
      await prisma.auditLog.deleteMany({
        where: {
          workspaceId: context.workspaceId,
        },
      });
      await prisma.rolePermission.deleteMany({
        where: {
          roleId: context.roleId,
        },
      });
      await prisma.workspaceMemberRole.deleteMany({
        where: {
          workspaceMemberId:
            context.workspaceMemberId,
        },
      });
      await prisma.workspaceMember.deleteMany({
        where: {
          id: context.workspaceMemberId,
        },
      });
      await prisma.subscription.deleteMany({
        where: {
          workspaceId: context.workspaceId,
        },
      });
      await prisma.billingAccount.deleteMany({
        where: {
          id: billingAccountId,
        },
      });
      await prisma.role.deleteMany({
        where: {
          id: context.roleId,
        },
      });
      await prisma.workspace.deleteMany({
        where: {
          id: context.workspaceId,
        },
      });
      await prisma.user.deleteMany({
        where: {
          id: context.userId,
        },
      });
      await prisma.$disconnect();
    });

    function createService(
      repository = requestRepository,
    ): DefaultProcurementApplicationService {
      return new DefaultProcurementApplicationService(
        repository,
        itemRepository,
        authorization,
        prisma,
      );
    }

    async function createUnderReviewRequest(
      number: string,
      title: string,
    ) {
      const service = createService();
      const created = await service.create({
        workspaceId: context.workspaceId,
        actorUserId: context.userId,
        requestedById: context.userId,
        number,
        title,
        items: [
          {
            lineNumber: 1,
            type: "SERVICE",
            description: "Review item",
            quantity: "1",
            unit: "job",
          },
        ],
      });
      await service.submit({
        workspaceId: context.workspaceId,
        actorUserId: context.userId,
        procurementRequestId: created.id,
      });
      await service.startReview({
        workspaceId: context.workspaceId,
        actorUserId: context.userId,
        procurementRequestId: created.id,
      });

      return created;
    }

    it(
      "creates a request with calculated totals and an audit entry",
      async () => {
        const number =
          `PR-SVC-${context.uniqueId}`;

        const result = await createService().create({
          workspaceId: context.workspaceId,
          actorUserId: context.userId,
          requestedById: context.userId,
          number,
          title: "Procurement service integration",
          items: [
            {
              lineNumber: 2,
              type: "SERVICE",
              description: "Installation",
              quantity: "2",
              unit: "job",
              estimatedUnitPrice: "750",
            },
            {
              lineNumber: 1,
              type: "MATERIAL",
              description: "Equipment",
              quantity: "3",
              unit: "each",
              estimatedUnitPrice: "1250.50",
            },
          ],
        });

        expect(result.status).toBe("DRAFT");
        expect(result.currency).toBe("SAR");
        expect(result.estimatedTotal).toBe(
          "5251.5",
        );
        expect(
          result.items.map(
            (item) => item.lineNumber,
          ),
        ).toEqual([1, 2]);

        const audit =
          await prisma.auditLog.findFirst({
            where: {
              workspaceId: context.workspaceId,
              action: "procurement.created",
              entityId: result.id,
            },
          });

        expect(audit).not.toBeNull();
      },
    );

    it(
      "rejects duplicate request numbers",
      async () => {
        const number =
          `PR-DUP-${context.uniqueId}`;
        const service = createService();
        const input = {
          workspaceId: context.workspaceId,
          actorUserId: context.userId,
          requestedById: context.userId,
          number,
          title: "Duplicate protection",
        };

        await service.create(input);

        await expect(
          service.create(input),
        ).rejects.toBeInstanceOf(
          ProcurementConflictError,
        );

        await expect(
          prisma.procurementRequest.count({
            where: {
              workspaceId: context.workspaceId,
              number,
            },
          }),
        ).resolves.toBe(1);
      },
    );

    it(
      "rejects creation when the permission is missing",
      async () => {
        const permission =
          createPermissionTestContext(
            context.roleId,
          );
        const number =
          `PR-DENIED-${context.uniqueId}`;

        await permission.revokePermission(
          Permissions.procurement.create,
        );

        try {
          await expect(
            createService().create({
              workspaceId: context.workspaceId,
              actorUserId: context.userId,
              requestedById: context.userId,
              number,
              title: "Denied request",
            }),
          ).rejects.toBeInstanceOf(
            PermissionDeniedError,
          );

          await expect(
            prisma.procurementRequest.count({
              where: {
                workspaceId:
                  context.workspaceId,
                number,
              },
            }),
          ).resolves.toBe(0);
        } finally {
          await permission.grantPermission(
            Permissions.procurement.create,
          );
        }
      },
    );

    it(
      "rolls back the request and items when audit logging fails",
      async () => {
        const number =
          `PR-ROLLBACK-${context.uniqueId}`;
        const service = createService(
          new ThrowingProcurementAuditRepository(),
        );

        await expect(
          service.create({
            workspaceId: context.workspaceId,
            actorUserId: context.userId,
            requestedById: context.userId,
            number,
            title: "Rollback verification",
            items: [
              {
                lineNumber: 1,
                type: "WORK",
                description: "Rollback item",
                quantity: "1",
                unit: "lot",
                estimatedUnitPrice: "100",
              },
            ],
          }),
        ).rejects.toThrow(
          "Simulated procurement audit failure.",
        );

        const persisted =
          await prisma.procurementRequest.findFirst({
            where: {
              workspaceId: context.workspaceId,
              number,
            },
            include: {
              items: true,
            },
          });

        expect(persisted).toBeNull();
      },
    );

    it(
      "updates editable fields, replaces items, recalculates totals, and audits the change",
      async () => {
        const service = createService();
        const created = await service.create({
          workspaceId: context.workspaceId,
          actorUserId: context.userId,
          requestedById: context.userId,
          number:
            `PR-UPDATE-${context.uniqueId}`,
          title: "Before update",
          items: [
            {
              lineNumber: 1,
              type: "MATERIAL",
              description: "Old item",
              quantity: "1",
              unit: "each",
              estimatedUnitPrice: "25",
            },
          ],
        });

        const updated = await service.update({
          workspaceId: context.workspaceId,
          actorUserId: context.userId,
          procurementRequestId: created.id,
          title: "After update",
          priority: "URGENT",
          items: [
            {
              lineNumber: 2,
              type: "SERVICE",
              description: "Support",
              quantity: "3",
              unit: "month",
              estimatedUnitPrice: "200",
            },
            {
              lineNumber: 1,
              type: "WORK",
              description: "Deployment",
              quantity: "2",
              unit: "job",
              estimatedUnitPrice: "450.25",
            },
          ],
        });

        expect(updated).toMatchObject({
          id: created.id,
          number: created.number,
          title: "After update",
          priority: "URGENT",
          status: "DRAFT",
          estimatedTotal: "1500.5",
        });
        expect(
          updated.items.map(
            (item) => item.lineNumber,
          ),
        ).toEqual([1, 2]);
        expect(
          updated.items.some(
            (item) =>
              item.description === "Old item",
          ),
        ).toBe(false);

        const audit =
          await prisma.auditLog.findFirst({
            where: {
              workspaceId: context.workspaceId,
              action: "procurement.updated",
              entityId: created.id,
            },
          });

        expect(audit?.metadata).toMatchObject({
          changedFields: [
            "title",
            "priority",
            "items",
          ],
          itemCount: 2,
        });
      },
    );

    it(
      "requires at least one mutable field",
      async () => {
        await expect(
          createService().update({
            workspaceId: context.workspaceId,
            actorUserId: context.userId,
            procurementRequestId:
              "missing-fields",
          }),
        ).rejects.toBeInstanceOf(
          ProcurementValidationError,
        );
      },
    );

    it(
      "rejects updates without permission and preserves the request",
      async () => {
        const service = createService();
        const created = await service.create({
          workspaceId: context.workspaceId,
          actorUserId: context.userId,
          requestedById: context.userId,
          number:
            `PR-UPD-DENIED-${context.uniqueId}`,
          title: "Original title",
        });
        const permission =
          createPermissionTestContext(
            context.roleId,
          );

        await permission.revokePermission(
          Permissions.procurement.update,
        );

        try {
          await expect(
            service.update({
              workspaceId:
                context.workspaceId,
              actorUserId: context.userId,
              procurementRequestId:
                created.id,
              title: "Forbidden title",
            }),
          ).rejects.toBeInstanceOf(
            PermissionDeniedError,
          );

          const persisted =
            await prisma.procurementRequest.findUniqueOrThrow({
              where: {
                id: created.id,
              },
            });

          expect(persisted.title).toBe(
            "Original title",
          );
        } finally {
          await permission.grantPermission(
            Permissions.procurement.update,
          );
        }
      },
    );

    it(
      "rejects updates outside editable states",
      async () => {
        const service = createService();
        const created = await service.create({
          workspaceId: context.workspaceId,
          actorUserId: context.userId,
          requestedById: context.userId,
          number:
            `PR-UPD-STATE-${context.uniqueId}`,
          title: "Submitted request",
        });

        await prisma.procurementRequest.update({
          where: {
            id: created.id,
          },
          data: {
            status: "SUBMITTED",
          },
        });

        await expect(
          service.update({
            workspaceId: context.workspaceId,
            actorUserId: context.userId,
            procurementRequestId: created.id,
            title: "Disallowed update",
          }),
        ).rejects.toBeInstanceOf(
          ProcurementStateTransitionError,
        );
      },
    );

    it(
      "rolls back request and item changes when update auditing fails",
      async () => {
        const service = createService();
        const created = await service.create({
          workspaceId: context.workspaceId,
          actorUserId: context.userId,
          requestedById: context.userId,
          number:
            `PR-UPD-ROLLBACK-${context.uniqueId}`,
          title: "Rollback original",
          items: [
            {
              lineNumber: 1,
              type: "MATERIAL",
              description: "Original item",
              quantity: "2",
              unit: "each",
              estimatedUnitPrice: "50",
            },
          ],
        });

        await expect(
          createService(
            new ThrowingProcurementUpdateAuditRepository(),
          ).update({
            workspaceId: context.workspaceId,
            actorUserId: context.userId,
            procurementRequestId: created.id,
            title: "Rollback changed",
            items: [
              {
                lineNumber: 1,
                type: "SERVICE",
                description: "Replacement item",
                quantity: "1",
                unit: "job",
                estimatedUnitPrice: "999",
              },
            ],
          }),
        ).rejects.toThrow(
          "Simulated procurement update audit failure.",
        );

        const persisted =
          await prisma.procurementRequest.findUniqueOrThrow({
            where: {
              id: created.id,
            },
            include: {
              items: true,
            },
          });

        expect(persisted.title).toBe(
          "Rollback original",
        );
        expect(
          persisted.estimatedTotal?.toString(),
        ).toBe("100");
        expect(persisted.items).toHaveLength(1);
        expect(
          persisted.items[0]?.description,
        ).toBe("Original item");
      },
    );

    it(
      "submits a draft request and records the transition",
      async () => {
        const service = createService();
        const created = await service.create({
          workspaceId: context.workspaceId,
          actorUserId: context.userId,
          requestedById: context.userId,
          number:
            `PR-SUBMIT-${context.uniqueId}`,
          title: "Ready to submit",
          items: [
            {
              lineNumber: 1,
              type: "SERVICE",
              description: "Consulting",
              quantity: "4",
              unit: "day",
              estimatedUnitPrice: "300",
            },
          ],
        });

        const submitted = await service.submit({
          workspaceId: context.workspaceId,
          actorUserId: context.userId,
          procurementRequestId: created.id,
        });

        expect(submitted.status).toBe(
          "SUBMITTED",
        );
        expect(submitted.items).toHaveLength(1);
        expect(submitted.estimatedTotal).toBe(
          "1200",
        );

        const audit =
          await prisma.auditLog.findFirst({
            where: {
              workspaceId: context.workspaceId,
              action: "procurement.submitted",
              entityId: created.id,
            },
          });

        expect(audit?.metadata).toMatchObject({
          previousStatus: "DRAFT",
          itemCount: 1,
        });
      },
    );

    it(
      "requires at least one item before submission",
      async () => {
        const service = createService();
        const created = await service.create({
          workspaceId: context.workspaceId,
          actorUserId: context.userId,
          requestedById: context.userId,
          number:
            `PR-SUBMIT-EMPTY-${context.uniqueId}`,
          title: "Empty request",
        });

        await expect(
          service.submit({
            workspaceId: context.workspaceId,
            actorUserId: context.userId,
            procurementRequestId: created.id,
          }),
        ).rejects.toBeInstanceOf(
          ProcurementValidationError,
        );

        const persisted =
          await prisma.procurementRequest.findUniqueOrThrow({
            where: {
              id: created.id,
            },
          });

        expect(persisted.status).toBe("DRAFT");
      },
    );

    it(
      "rejects submission without update permission",
      async () => {
        const service = createService();
        const created = await service.create({
          workspaceId: context.workspaceId,
          actorUserId: context.userId,
          requestedById: context.userId,
          number:
            `PR-SUBMIT-DENIED-${context.uniqueId}`,
          title: "Denied submission",
          items: [
            {
              lineNumber: 1,
              type: "MATERIAL",
              description: "Required item",
              quantity: "1",
              unit: "each",
            },
          ],
        });
        const permission =
          createPermissionTestContext(
            context.roleId,
          );

        await permission.revokePermission(
          Permissions.procurement.update,
        );

        try {
          await expect(
            service.submit({
              workspaceId:
                context.workspaceId,
              actorUserId: context.userId,
              procurementRequestId:
                created.id,
            }),
          ).rejects.toBeInstanceOf(
            PermissionDeniedError,
          );

          const persisted =
            await prisma.procurementRequest.findUniqueOrThrow({
              where: {
                id: created.id,
              },
            });

          expect(persisted.status).toBe(
            "DRAFT",
          );
        } finally {
          await permission.grantPermission(
            Permissions.procurement.update,
          );
        }
      },
    );

    it(
      "rejects repeated submission",
      async () => {
        const service = createService();
        const created = await service.create({
          workspaceId: context.workspaceId,
          actorUserId: context.userId,
          requestedById: context.userId,
          number:
            `PR-SUBMIT-STATE-${context.uniqueId}`,
          title: "Submit once",
          items: [
            {
              lineNumber: 1,
              type: "WORK",
              description: "Scope",
              quantity: "1",
              unit: "lot",
            },
          ],
        });
        const command = {
          workspaceId: context.workspaceId,
          actorUserId: context.userId,
          procurementRequestId: created.id,
        };

        await service.submit(command);

        await expect(
          service.submit(command),
        ).rejects.toBeInstanceOf(
          ProcurementStateTransitionError,
        );
      },
    );

    it(
      "rolls back submission when transition auditing fails",
      async () => {
        const service = createService();
        const created = await service.create({
          workspaceId: context.workspaceId,
          actorUserId: context.userId,
          requestedById: context.userId,
          number:
            `PR-SUBMIT-ROLLBACK-${context.uniqueId}`,
          title: "Submission rollback",
          items: [
            {
              lineNumber: 1,
              type: "MATERIAL",
              description: "Rollback item",
              quantity: "2",
              unit: "each",
              estimatedUnitPrice: "75",
            },
          ],
        });

        await expect(
          createService(
            new ThrowingProcurementSubmitAuditRepository(),
          ).submit({
            workspaceId: context.workspaceId,
            actorUserId: context.userId,
            procurementRequestId: created.id,
          }),
        ).rejects.toThrow(
          "Simulated procurement submit audit failure.",
        );

        const persisted =
          await prisma.procurementRequest.findUniqueOrThrow({
            where: {
              id: created.id,
            },
          });

        expect(persisted.status).toBe("DRAFT");
        await expect(
          prisma.auditLog.count({
            where: {
              workspaceId: context.workspaceId,
              action: "procurement.submitted",
              entityId: created.id,
            },
          }),
        ).resolves.toBe(0);
      },
    );

    it(
      "starts review for a submitted request and audits the transition",
      async () => {
        const service = createService();
        const created = await service.create({
          workspaceId: context.workspaceId,
          actorUserId: context.userId,
          requestedById: context.userId,
          number:
            `PR-REVIEW-${context.uniqueId}`,
          title: "Ready for review",
          items: [
            {
              lineNumber: 1,
              type: "SERVICE",
              description: "Review scope",
              quantity: "1",
              unit: "job",
            },
          ],
        });
        await service.submit({
          workspaceId: context.workspaceId,
          actorUserId: context.userId,
          procurementRequestId: created.id,
        });

        const underReview =
          await service.startReview({
            workspaceId: context.workspaceId,
            actorUserId: context.userId,
            procurementRequestId: created.id,
          });

        expect(underReview.status).toBe(
          "UNDER_REVIEW",
        );
        expect(underReview.items).toHaveLength(1);

        const audit =
          await prisma.auditLog.findFirst({
            where: {
              workspaceId: context.workspaceId,
              action:
                "procurement.review_started",
              entityId: created.id,
            },
          });

        expect(audit?.metadata).toMatchObject({
          previousStatus: "SUBMITTED",
        });
      },
    );

    it(
      "requires approve permission to start review",
      async () => {
        const service = createService();
        const created = await service.create({
          workspaceId: context.workspaceId,
          actorUserId: context.userId,
          requestedById: context.userId,
          number:
            `PR-REVIEW-DENIED-${context.uniqueId}`,
          title: "Denied review",
          items: [
            {
              lineNumber: 1,
              type: "MATERIAL",
              description: "Review item",
              quantity: "1",
              unit: "each",
            },
          ],
        });
        await service.submit({
          workspaceId: context.workspaceId,
          actorUserId: context.userId,
          procurementRequestId: created.id,
        });
        const permission =
          createPermissionTestContext(
            context.roleId,
          );

        await permission.revokePermission(
          Permissions.procurement.approve,
        );

        try {
          await expect(
            service.startReview({
              workspaceId:
                context.workspaceId,
              actorUserId: context.userId,
              procurementRequestId:
                created.id,
            }),
          ).rejects.toBeInstanceOf(
            PermissionDeniedError,
          );

          const persisted =
            await prisma.procurementRequest.findUniqueOrThrow({
              where: {
                id: created.id,
              },
            });

          expect(persisted.status).toBe(
            "SUBMITTED",
          );
        } finally {
          await permission.grantPermission(
            Permissions.procurement.approve,
          );
        }
      },
    );

    it(
      "rejects starting review from draft",
      async () => {
        const service = createService();
        const created = await service.create({
          workspaceId: context.workspaceId,
          actorUserId: context.userId,
          requestedById: context.userId,
          number:
            `PR-REVIEW-STATE-${context.uniqueId}`,
          title: "Draft review",
        });

        await expect(
          service.startReview({
            workspaceId: context.workspaceId,
            actorUserId: context.userId,
            procurementRequestId: created.id,
          }),
        ).rejects.toBeInstanceOf(
          ProcurementStateTransitionError,
        );
      },
    );

    it(
      "rolls back review start when auditing fails",
      async () => {
        const service = createService();
        const created = await service.create({
          workspaceId: context.workspaceId,
          actorUserId: context.userId,
          requestedById: context.userId,
          number:
            `PR-REVIEW-ROLLBACK-${context.uniqueId}`,
          title: "Review rollback",
          items: [
            {
              lineNumber: 1,
              type: "WORK",
              description: "Rollback scope",
              quantity: "1",
              unit: "lot",
            },
          ],
        });
        await service.submit({
          workspaceId: context.workspaceId,
          actorUserId: context.userId,
          procurementRequestId: created.id,
        });

        await expect(
          createService(
            new ThrowingProcurementStartReviewAuditRepository(),
          ).startReview({
            workspaceId: context.workspaceId,
            actorUserId: context.userId,
            procurementRequestId: created.id,
          }),
        ).rejects.toThrow(
          "Simulated procurement review audit failure.",
        );

        const persisted =
          await prisma.procurementRequest.findUniqueOrThrow({
            where: {
              id: created.id,
            },
          });

        expect(persisted.status).toBe(
          "SUBMITTED",
        );
        await expect(
          prisma.auditLog.count({
            where: {
              workspaceId: context.workspaceId,
              action:
                "procurement.review_started",
              entityId: created.id,
            },
          }),
        ).resolves.toBe(0);
      },
    );

    it(
      "requests changes from review and records the reason",
      async () => {
        const created =
          await createUnderReviewRequest(
            `PR-CHANGES-${context.uniqueId}`,
            "Needs changes",
          );

        const changed =
          await createService().requestChanges({
            workspaceId: context.workspaceId,
            actorUserId: context.userId,
            procurementRequestId: created.id,
            reason:
              "  Clarify delivery requirements.  ",
          });

        expect(changed.status).toBe(
          "CHANGES_REQUESTED",
        );
        expect(changed.items).toHaveLength(1);

        const audit =
          await prisma.auditLog.findFirst({
            where: {
              workspaceId: context.workspaceId,
              action:
                "procurement.changes_requested",
              entityId: created.id,
            },
          });

        expect(audit?.metadata).toMatchObject({
          previousStatus: "UNDER_REVIEW",
          reason:
            "Clarify delivery requirements.",
        });
      },
    );

    it(
      "requires a non-empty reason for requested changes",
      async () => {
        await expect(
          createService().requestChanges({
            workspaceId: context.workspaceId,
            actorUserId: context.userId,
            procurementRequestId:
              "missing-reason",
            reason: "   ",
          }),
        ).rejects.toBeInstanceOf(
          ProcurementValidationError,
        );
      },
    );

    it(
      "requires approve permission to request changes",
      async () => {
        const created =
          await createUnderReviewRequest(
            `PR-CHANGES-DENIED-${context.uniqueId}`,
            "Denied changes",
          );
        const permission =
          createPermissionTestContext(
            context.roleId,
          );

        await permission.revokePermission(
          Permissions.procurement.approve,
        );

        try {
          await expect(
            createService().requestChanges({
              workspaceId:
                context.workspaceId,
              actorUserId: context.userId,
              procurementRequestId:
                created.id,
              reason: "Not authorized",
            }),
          ).rejects.toBeInstanceOf(
            PermissionDeniedError,
          );

          const persisted =
            await prisma.procurementRequest.findUniqueOrThrow({
              where: {
                id: created.id,
              },
            });

          expect(persisted.status).toBe(
            "UNDER_REVIEW",
          );
        } finally {
          await permission.grantPermission(
            Permissions.procurement.approve,
          );
        }
      },
    );

    it(
      "rejects requesting changes outside review",
      async () => {
        const service = createService();
        const created = await service.create({
          workspaceId: context.workspaceId,
          actorUserId: context.userId,
          requestedById: context.userId,
          number:
            `PR-CHANGES-STATE-${context.uniqueId}`,
          title: "Draft changes",
        });

        await expect(
          service.requestChanges({
            workspaceId: context.workspaceId,
            actorUserId: context.userId,
            procurementRequestId: created.id,
            reason: "Invalid state",
          }),
        ).rejects.toBeInstanceOf(
          ProcurementStateTransitionError,
        );
      },
    );

    it(
      "rolls back requested changes when auditing fails",
      async () => {
        const created =
          await createUnderReviewRequest(
            `PR-CHANGES-ROLLBACK-${context.uniqueId}`,
            "Changes rollback",
          );

        await expect(
          createService(
            new ThrowingProcurementRequestChangesAuditRepository(),
          ).requestChanges({
            workspaceId: context.workspaceId,
            actorUserId: context.userId,
            procurementRequestId: created.id,
            reason: "Rollback reason",
          }),
        ).rejects.toThrow(
          "Simulated procurement changes audit failure.",
        );

        const persisted =
          await prisma.procurementRequest.findUniqueOrThrow({
            where: {
              id: created.id,
            },
          });

        expect(persisted.status).toBe(
          "UNDER_REVIEW",
        );
        await expect(
          prisma.auditLog.count({
            where: {
              workspaceId: context.workspaceId,
              action:
                "procurement.changes_requested",
              entityId: created.id,
            },
          }),
        ).resolves.toBe(0);
      },
    );

    it(
      "approves a request under review and records the decision",
      async () => {
        const created =
          await createUnderReviewRequest(
            `PR-APPROVE-${context.uniqueId}`,
            "Ready for approval",
          );

        const approved =
          await createService().approve({
            workspaceId: context.workspaceId,
            actorUserId: context.userId,
            procurementRequestId: created.id,
            reason: "  Requirements verified.  ",
          });

        expect(approved.status).toBe(
          "APPROVED",
        );
        expect(approved.items).toHaveLength(1);

        const audit =
          await prisma.auditLog.findFirst({
            where: {
              workspaceId: context.workspaceId,
              action: "procurement.approved",
              entityId: created.id,
            },
          });

        expect(audit?.metadata).toMatchObject({
          previousStatus: "UNDER_REVIEW",
          reason: "Requirements verified.",
        });
      },
    );

    it(
      "requires approve permission for approval",
      async () => {
        const created =
          await createUnderReviewRequest(
            `PR-APPROVE-DENIED-${context.uniqueId}`,
            "Denied approval",
          );
        const permission =
          createPermissionTestContext(
            context.roleId,
          );

        await permission.revokePermission(
          Permissions.procurement.approve,
        );

        try {
          await expect(
            createService().approve({
              workspaceId:
                context.workspaceId,
              actorUserId: context.userId,
              procurementRequestId:
                created.id,
            }),
          ).rejects.toBeInstanceOf(
            PermissionDeniedError,
          );

          const persisted =
            await prisma.procurementRequest.findUniqueOrThrow({
              where: {
                id: created.id,
              },
            });

          expect(persisted.status).toBe(
            "UNDER_REVIEW",
          );
        } finally {
          await permission.grantPermission(
            Permissions.procurement.approve,
          );
        }
      },
    );

    it(
      "rejects approval outside review",
      async () => {
        const service = createService();
        const created = await service.create({
          workspaceId: context.workspaceId,
          actorUserId: context.userId,
          requestedById: context.userId,
          number:
            `PR-APPROVE-STATE-${context.uniqueId}`,
          title: "Draft approval",
        });

        await expect(
          service.approve({
            workspaceId: context.workspaceId,
            actorUserId: context.userId,
            procurementRequestId: created.id,
          }),
        ).rejects.toBeInstanceOf(
          ProcurementStateTransitionError,
        );
      },
    );

    it(
      "rolls back approval when auditing fails",
      async () => {
        const created =
          await createUnderReviewRequest(
            `PR-APPROVE-ROLLBACK-${context.uniqueId}`,
            "Approval rollback",
          );

        await expect(
          createService(
            new ThrowingProcurementApproveAuditRepository(),
          ).approve({
            workspaceId: context.workspaceId,
            actorUserId: context.userId,
            procurementRequestId: created.id,
          }),
        ).rejects.toThrow(
          "Simulated procurement approval audit failure.",
        );

        const persisted =
          await prisma.procurementRequest.findUniqueOrThrow({
            where: {
              id: created.id,
            },
          });

        expect(persisted.status).toBe(
          "UNDER_REVIEW",
        );
        await expect(
          prisma.auditLog.count({
            where: {
              workspaceId: context.workspaceId,
              action: "procurement.approved",
              entityId: created.id,
            },
          }),
        ).resolves.toBe(0);
      },
    );

    it(
      "rejects a request under review and records the reason",
      async () => {
        const created =
          await createUnderReviewRequest(
            `PR-REJECT-${context.uniqueId}`,
            "Ready for rejection",
          );

        const rejected =
          await createService().reject({
            workspaceId: context.workspaceId,
            actorUserId: context.userId,
            procurementRequestId: created.id,
            reason:
              "  Budget justification is incomplete.  ",
          });

        expect(rejected.status).toBe(
          "REJECTED",
        );
        expect(rejected.items).toHaveLength(1);

        const audit =
          await prisma.auditLog.findFirst({
            where: {
              workspaceId: context.workspaceId,
              action: "procurement.rejected",
              entityId: created.id,
            },
          });

        expect(audit?.metadata).toMatchObject({
          previousStatus: "UNDER_REVIEW",
          reason:
            "Budget justification is incomplete.",
        });
      },
    );

    it(
      "requires a non-empty rejection reason",
      async () => {
        await expect(
          createService().reject({
            workspaceId: context.workspaceId,
            actorUserId: context.userId,
            procurementRequestId:
              "missing-rejection-reason",
            reason: " ",
          }),
        ).rejects.toBeInstanceOf(
          ProcurementValidationError,
        );
      },
    );

    it(
      "requires approve permission for rejection",
      async () => {
        const created =
          await createUnderReviewRequest(
            `PR-REJECT-DENIED-${context.uniqueId}`,
            "Denied rejection",
          );
        const permission =
          createPermissionTestContext(
            context.roleId,
          );

        await permission.revokePermission(
          Permissions.procurement.approve,
        );

        try {
          await expect(
            createService().reject({
              workspaceId:
                context.workspaceId,
              actorUserId: context.userId,
              procurementRequestId:
                created.id,
              reason: "Not authorized",
            }),
          ).rejects.toBeInstanceOf(
            PermissionDeniedError,
          );

          const persisted =
            await prisma.procurementRequest.findUniqueOrThrow({
              where: {
                id: created.id,
              },
            });

          expect(persisted.status).toBe(
            "UNDER_REVIEW",
          );
        } finally {
          await permission.grantPermission(
            Permissions.procurement.approve,
          );
        }
      },
    );

    it(
      "rejects rejection outside review",
      async () => {
        const service = createService();
        const created = await service.create({
          workspaceId: context.workspaceId,
          actorUserId: context.userId,
          requestedById: context.userId,
          number:
            `PR-REJECT-STATE-${context.uniqueId}`,
          title: "Draft rejection",
        });

        await expect(
          service.reject({
            workspaceId: context.workspaceId,
            actorUserId: context.userId,
            procurementRequestId: created.id,
            reason: "Invalid state",
          }),
        ).rejects.toBeInstanceOf(
          ProcurementStateTransitionError,
        );
      },
    );

    it(
      "rolls back rejection when auditing fails",
      async () => {
        const created =
          await createUnderReviewRequest(
            `PR-REJECT-ROLLBACK-${context.uniqueId}`,
            "Rejection rollback",
          );

        await expect(
          createService(
            new ThrowingProcurementRejectAuditRepository(),
          ).reject({
            workspaceId: context.workspaceId,
            actorUserId: context.userId,
            procurementRequestId: created.id,
            reason: "Rollback rejection",
          }),
        ).rejects.toThrow(
          "Simulated procurement rejection audit failure.",
        );

        const persisted =
          await prisma.procurementRequest.findUniqueOrThrow({
            where: {
              id: created.id,
            },
          });

        expect(persisted.status).toBe(
          "UNDER_REVIEW",
        );
        await expect(
          prisma.auditLog.count({
            where: {
              workspaceId: context.workspaceId,
              action: "procurement.rejected",
              entityId: created.id,
            },
          }),
        ).resolves.toBe(0);
      },
    );

    it(
      "cancels a submitted request and records the reason",
      async () => {
        const service = createService();
        const created = await service.create({
          workspaceId: context.workspaceId,
          actorUserId: context.userId,
          requestedById: context.userId,
          number:
            `PR-CANCEL-${context.uniqueId}`,
          title: "Cancellation request",
          items: [
            {
              lineNumber: 1,
              type: "MATERIAL",
              description: "Cancelled item",
              quantity: "1",
              unit: "each",
            },
          ],
        });
        await service.submit({
          workspaceId: context.workspaceId,
          actorUserId: context.userId,
          procurementRequestId: created.id,
        });

        const cancelled = await service.cancel({
          workspaceId: context.workspaceId,
          actorUserId: context.userId,
          procurementRequestId: created.id,
          reason: "  Business need changed.  ",
        });

        expect(cancelled.status).toBe(
          "CANCELLED",
        );
        expect(cancelled.items).toHaveLength(1);

        const audit =
          await prisma.auditLog.findFirst({
            where: {
              workspaceId: context.workspaceId,
              action: "procurement.cancelled",
              entityId: created.id,
            },
          });

        expect(audit?.metadata).toMatchObject({
          previousStatus: "SUBMITTED",
          reason: "Business need changed.",
        });
      },
    );

    it(
      "allows draft cancellation without a reason",
      async () => {
        const service = createService();
        const created = await service.create({
          workspaceId: context.workspaceId,
          actorUserId: context.userId,
          requestedById: context.userId,
          number:
            `PR-CANCEL-DRAFT-${context.uniqueId}`,
          title: "Draft cancellation",
        });

        const cancelled = await service.cancel({
          workspaceId: context.workspaceId,
          actorUserId: context.userId,
          procurementRequestId: created.id,
        });

        expect(cancelled.status).toBe(
          "CANCELLED",
        );
      },
    );

    it(
      "requires update permission for cancellation",
      async () => {
        const service = createService();
        const created = await service.create({
          workspaceId: context.workspaceId,
          actorUserId: context.userId,
          requestedById: context.userId,
          number:
            `PR-CANCEL-DENIED-${context.uniqueId}`,
          title: "Denied cancellation",
        });
        const permission =
          createPermissionTestContext(
            context.roleId,
          );

        await permission.revokePermission(
          Permissions.procurement.update,
        );

        try {
          await expect(
            service.cancel({
              workspaceId:
                context.workspaceId,
              actorUserId: context.userId,
              procurementRequestId:
                created.id,
            }),
          ).rejects.toBeInstanceOf(
            PermissionDeniedError,
          );

          const persisted =
            await prisma.procurementRequest.findUniqueOrThrow({
              where: {
                id: created.id,
              },
            });

          expect(persisted.status).toBe(
            "DRAFT",
          );
        } finally {
          await permission.grantPermission(
            Permissions.procurement.update,
          );
        }
      },
    );

    it(
      "rejects cancellation after a final decision",
      async () => {
        const created =
          await createUnderReviewRequest(
            `PR-CANCEL-STATE-${context.uniqueId}`,
            "Approved cancellation",
          );
        const service = createService();
        await service.approve({
          workspaceId: context.workspaceId,
          actorUserId: context.userId,
          procurementRequestId: created.id,
        });

        await expect(
          service.cancel({
            workspaceId: context.workspaceId,
            actorUserId: context.userId,
            procurementRequestId: created.id,
          }),
        ).rejects.toBeInstanceOf(
          ProcurementStateTransitionError,
        );
      },
    );

    it(
      "rolls back cancellation when auditing fails",
      async () => {
        const service = createService();
        const created = await service.create({
          workspaceId: context.workspaceId,
          actorUserId: context.userId,
          requestedById: context.userId,
          number:
            `PR-CANCEL-ROLLBACK-${context.uniqueId}`,
          title: "Cancellation rollback",
        });

        await expect(
          createService(
            new ThrowingProcurementCancelAuditRepository(),
          ).cancel({
            workspaceId: context.workspaceId,
            actorUserId: context.userId,
            procurementRequestId: created.id,
          }),
        ).rejects.toThrow(
          "Simulated procurement cancellation audit failure.",
        );

        const persisted =
          await prisma.procurementRequest.findUniqueOrThrow({
            where: {
              id: created.id,
            },
          });

        expect(persisted.status).toBe("DRAFT");
        await expect(
          prisma.auditLog.count({
            where: {
              workspaceId: context.workspaceId,
              action: "procurement.cancelled",
              entityId: created.id,
            },
          }),
        ).resolves.toBe(0);
      },
    );

    it(
      "archives an approved request and records its previous status",
      async () => {
        const created =
          await createUnderReviewRequest(
            `PR-ARCHIVE-${context.uniqueId}`,
            "Approved archive",
          );
        const service = createService();
        await service.approve({
          workspaceId: context.workspaceId,
          actorUserId: context.userId,
          procurementRequestId: created.id,
        });

        const archived = await service.archive({
          workspaceId: context.workspaceId,
          actorUserId: context.userId,
          procurementRequestId: created.id,
          reason: "  Retention policy.  ",
        });

        expect(archived.status).toBe("ARCHIVED");
        expect(archived.items).toHaveLength(1);

        const audit =
          await prisma.auditLog.findFirst({
            where: {
              workspaceId: context.workspaceId,
              action: "procurement.archived",
              entityId: created.id,
            },
          });

        expect(audit?.metadata).toMatchObject({
          previousStatus: "APPROVED",
          reason: "Retention policy.",
        });
      },
    );

    it(
      "archives a cancelled request",
      async () => {
        const service = createService();
        const created = await service.create({
          workspaceId: context.workspaceId,
          actorUserId: context.userId,
          requestedById: context.userId,
          number:
            `PR-ARCHIVE-CANCELLED-${context.uniqueId}`,
          title: "Cancelled archive",
        });
        await service.cancel({
          workspaceId: context.workspaceId,
          actorUserId: context.userId,
          procurementRequestId: created.id,
        });

        const archived = await service.archive({
          workspaceId: context.workspaceId,
          actorUserId: context.userId,
          procurementRequestId: created.id,
        });

        expect(archived.status).toBe("ARCHIVED");
      },
    );

    it(
      "requires delete permission for archiving",
      async () => {
        const service = createService();
        const created = await service.create({
          workspaceId: context.workspaceId,
          actorUserId: context.userId,
          requestedById: context.userId,
          number:
            `PR-ARCHIVE-DENIED-${context.uniqueId}`,
          title: "Denied archive",
        });
        await service.cancel({
          workspaceId: context.workspaceId,
          actorUserId: context.userId,
          procurementRequestId: created.id,
        });
        const permission =
          createPermissionTestContext(
            context.roleId,
          );
        await permission.revokePermission(
          Permissions.procurement.delete,
        );

        try {
          await expect(
            service.archive({
              workspaceId:
                context.workspaceId,
              actorUserId: context.userId,
              procurementRequestId:
                created.id,
            }),
          ).rejects.toBeInstanceOf(
            PermissionDeniedError,
          );
        } finally {
          await permission.grantPermission(
            Permissions.procurement.delete,
          );
        }
      },
    );

    it(
      "rejects archiving an active request",
      async () => {
        const service = createService();
        const created = await service.create({
          workspaceId: context.workspaceId,
          actorUserId: context.userId,
          requestedById: context.userId,
          number:
            `PR-ARCHIVE-STATE-${context.uniqueId}`,
          title: "Active archive",
        });

        await expect(
          service.archive({
            workspaceId: context.workspaceId,
            actorUserId: context.userId,
            procurementRequestId: created.id,
          }),
        ).rejects.toBeInstanceOf(
          ProcurementStateTransitionError,
        );
      },
    );

    it(
      "rolls back archiving when auditing fails",
      async () => {
        const service = createService();
        const created = await service.create({
          workspaceId: context.workspaceId,
          actorUserId: context.userId,
          requestedById: context.userId,
          number:
            `PR-ARCHIVE-ROLLBACK-${context.uniqueId}`,
          title: "Archive rollback",
        });
        await service.cancel({
          workspaceId: context.workspaceId,
          actorUserId: context.userId,
          procurementRequestId: created.id,
        });

        await expect(
          createService(
            new ThrowingProcurementArchiveAuditRepository(),
          ).archive({
            workspaceId: context.workspaceId,
            actorUserId: context.userId,
            procurementRequestId: created.id,
          }),
        ).rejects.toThrow(
          "Simulated procurement archive audit failure.",
        );

        const persisted =
          await prisma.procurementRequest.findUniqueOrThrow({
            where: {
              id: created.id,
            },
          });

        expect(persisted.status).toBe(
          "CANCELLED",
        );
        await expect(
          prisma.auditLog.count({
            where: {
              workspaceId: context.workspaceId,
              action: "procurement.archived",
              entityId: created.id,
            },
          }),
        ).resolves.toBe(0);
      },
    );

    it(
      "loads a request by id with its ordered items",
      async () => {
        const service = createService();
        const created = await service.create({
          workspaceId: context.workspaceId,
          actorUserId: context.userId,
          requestedById: context.userId,
          number:
            `PR-READ-${context.uniqueId}`,
          title: "Read details",
          items: [
            {
              lineNumber: 2,
              type: "SERVICE",
              description: "Second item",
              quantity: "1",
              unit: "job",
            },
            {
              lineNumber: 1,
              type: "MATERIAL",
              description: "First item",
              quantity: "2",
              unit: "each",
            },
          ],
        });

        const result = await service.getById({
          workspaceId: context.workspaceId,
          actorUserId: context.userId,
          procurementRequestId: created.id,
        });

        expect(result.id).toBe(created.id);
        expect(
          result.items.map(
            (item) => item.lineNumber,
          ),
        ).toEqual([1, 2]);
      },
    );

    it(
      "does not expose requests outside the workspace scope",
      async () => {
        await expect(
          createService().getById({
            workspaceId: context.workspaceId,
            actorUserId: context.userId,
            procurementRequestId:
              `foreign-${context.uniqueId}`,
          }),
        ).rejects.toBeInstanceOf(
          ProcurementNotFoundError,
        );
      },
    );

    it(
      "requires read permission for details and lists",
      async () => {
        const permission =
          createPermissionTestContext(
            context.roleId,
          );
        await permission.revokePermission(
          Permissions.procurement.read,
        );

        try {
          await expect(
            createService().list({
              workspaceId:
                context.workspaceId,
              actorUserId: context.userId,
            }),
          ).rejects.toBeInstanceOf(
            PermissionDeniedError,
          );
        } finally {
          await permission.grantPermission(
            Permissions.procurement.read,
          );
        }
      },
    );

    it(
      "filters, searches, and paginates request summaries",
      async () => {
        const service = createService();
        const category =
          `read-${context.uniqueId}`;

        for (const [index, priority] of [
          [1, "HIGH"],
          [2, "HIGH"],
          [3, "NORMAL"],
        ] as const) {
          await service.create({
            workspaceId: context.workspaceId,
            actorUserId: context.userId,
            requestedById: context.userId,
            number:
              `PR-LIST-${index}-${context.uniqueId}`,
            title:
              `List marker ${index} ${context.uniqueId}`,
            category,
            priority,
          });
        }

        const firstPage = await service.list({
          workspaceId: context.workspaceId,
          actorUserId: context.userId,
          category,
          priority: "HIGH",
          page: 1,
          pageSize: 1,
        });

        expect(firstPage).toMatchObject({
          total: 2,
          page: 1,
          pageSize: 1,
          totalPages: 2,
        });
        expect(firstPage.items).toHaveLength(1);
        expect(
          "description" in firstPage.items[0]!,
        ).toBe(false);
        expect(
          "items" in firstPage.items[0]!,
        ).toBe(false);

        const searched = await service.list({
          workspaceId: context.workspaceId,
          actorUserId: context.userId,
          search:
            `List marker 3 ${context.uniqueId}`,
        });

        expect(searched.total).toBe(1);
        expect(searched.items[0]?.priority).toBe(
          "NORMAL",
        );
      },
    );

    it(
      "validates list date ranges",
      async () => {
        await expect(
          createService().list({
            workspaceId: context.workspaceId,
            actorUserId: context.userId,
            requiredByFrom: "not-a-date",
          }),
        ).rejects.toBeInstanceOf(
          ProcurementValidationError,
        );

        await expect(
          createService().list({
            workspaceId: context.workspaceId,
            actorUserId: context.userId,
            requiredByFrom: "2026-08-02",
            requiredByTo: "2026-08-01",
          }),
        ).rejects.toBeInstanceOf(
          ProcurementValidationError,
        );
      },
    );
  },
  120_000,
);
