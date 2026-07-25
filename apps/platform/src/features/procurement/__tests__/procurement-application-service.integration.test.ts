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
  type CreateProcurementRequestAuditInput,
  type ProcurementTransactionClient,
} from "../repositories";
import {
  DefaultProcurementApplicationService,
  ProcurementConflictError,
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
    _transaction: ProcurementTransactionClient,
    _input: CreateProcurementRequestAuditInput,
  ): Promise<void> {
    throw new Error(
      "Simulated procurement audit failure.",
    );
  }
}

describe(
  "DefaultProcurementApplicationService.create",
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
  },
  120_000,
);
