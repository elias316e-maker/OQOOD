import "dotenv/config";

import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import {
  ProcurementItemType,
  ProcurementPriority,
  ProcurementRequestStatus,
  ProjectStatus,
  Prisma,
  WorkspaceStatus,
} from "@/generated/prisma/client";

import {
  PrismaProcurementRequestItemRepository,
  PrismaProcurementRequestRepository,
} from "../repositories";

import {
  prisma,
} from "@/lib/prisma";

describe(
  "Procurement Repositories",
  () => {
    const requestRepository =
      new PrismaProcurementRequestRepository();

    const itemRepository =
      new PrismaProcurementRequestItemRepository();

    const suffix = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    let userId: string;
    let workspaceId: string;
    let projectId: string;
    let requestId: string;

    beforeAll(async () => {
      const user = await prisma.user.create({
        data: {
          name: "Procurement Repository Test User",
          email:
            `procurement-repository-${suffix}@example.com`,
          emailVerified: true,
          isActive: true,
        },
        select: {
          id: true,
        },
      });

      userId = user.id;

      const workspace =
        await prisma.workspace.create({
          data: {
            nameAr:
              "مساحة اختبار مستودع المشتريات",
            nameEn:
              "Procurement Repository Test Workspace",
            slug:
              `procurement-repository-${suffix}`,
            code:
              `PROC-${suffix}`.toUpperCase(),
            status: WorkspaceStatus.ACTIVE,
            createdById: userId,
          },
          select: {
            id: true,
          },
        });

      workspaceId = workspace.id;

      const project =
        await prisma.project.create({
          data: {
            workspaceId,
            nameAr:
              "مشروع اختبار مستودع المشتريات",
            nameEn:
              "Procurement Repository Test Project",
            code:
              `PROC-${suffix}`,
            status: ProjectStatus.ACTIVE,
            createdById: userId,
          },
          select: {
            id: true,
          },
        });

      projectId = project.id;
    });

    afterAll(async () => {
      if (workspaceId) {
        await prisma.procurementRequestItem.deleteMany({
          where: {
            procurementRequest: {
              workspaceId,
            },
          },
        });

        await prisma.procurementRequest.deleteMany({
          where: {
            workspaceId,
          },
        });

        await prisma.project.deleteMany({
          where: {
            workspaceId,
          },
        });

        await prisma.workspace.deleteMany({
          where: {
            id: workspaceId,
          },
        });
      }

      if (userId) {
        await prisma.user.deleteMany({
          where: {
            id: userId,
          },
        });
      }

      await prisma.$disconnect();
    });

    it(
      "creates and reads a procurement request",
      async () => {
        const result =
          await prisma.$transaction(
            async (transaction) => {
              const created =
                await requestRepository.create(
                  transaction,
                  {
                    workspaceId,
                    projectId,
                    number:
                      `PR-${suffix}`,
                    title:
                      "توريد مواد اختبارية",
                    description:
                      "طلب شراء لاختبار طبقة Repository",
                    status:
                      ProcurementRequestStatus.DRAFT,
                    priority:
                      ProcurementPriority.HIGH,
                    category:
                      "TEST",
                    requiredByDate:
                      new Date(
                        Date.now() +
                          7 *
                            24 *
                            60 *
                            60 *
                            1000,
                      ),
                    currency: "SAR",
                    estimatedTotal:
                      new Prisma.Decimal(
                        "2500.00",
                      ),
                    requestedById:
                      userId,
                    assignedToId:
                      userId,
                    createdById:
                      userId,
                  },
                );

              const byId =
                await requestRepository.findById(
                  transaction,
                  workspaceId,
                  created.id,
                );

              const byNumber =
                await requestRepository.findByNumber(
                  transaction,
                  workspaceId,
                  created.number,
                );

              const exists =
                await requestRepository.existsByNumber(
                  transaction,
                  workspaceId,
                  created.number,
                );

              return {
                created,
                byId,
                byNumber,
                exists,
              };
            },
          );

        requestId =
          result.created.id;

        expect(result.byId?.id).toBe(
          result.created.id,
        );

        expect(
          result.byNumber?.number,
        ).toBe(
          result.created.number,
        );

        expect(result.exists).toBe(true);
      },
    );

    it(
      "lists and counts requests using workspace filters",
      async () => {
        const result =
          await prisma.$transaction(
            async (transaction) => {
              const items =
                await requestRepository.listByWorkspace(
                  transaction,
                  {
                    workspaceId,
                    filters: {
                      status:
                        ProcurementRequestStatus.DRAFT,
                      priority:
                        ProcurementPriority.HIGH,
                      search:
                        "مواد اختبارية",
                    },
                    limit: 20,
                    offset: 0,
                  },
                );

              const total =
                await requestRepository.countByWorkspace(
                  transaction,
                  workspaceId,
                  {
                    status:
                      ProcurementRequestStatus.DRAFT,
                    priority:
                      ProcurementPriority.HIGH,
                    search:
                      "مواد اختبارية",
                  },
                );

              return {
                items,
                total,
              };
            },
          );

        expect(result.total).toBe(1);
        expect(result.items).toHaveLength(1);
        expect(result.items[0]?.id).toBe(
          requestId,
        );
      },
    );

    it(
      "creates, updates, lists, and deletes request items",
      async () => {
        const result =
          await prisma.$transaction(
            async (transaction) => {
              const createdItems =
                await itemRepository.createMany(
                  transaction,
                  [
                    {
                      procurementRequestId:
                        requestId,
                      lineNumber: 2,
                      type:
                        ProcurementItemType.SERVICE,
                      description:
                        "خدمة اختبارية",
                      quantity:
                        new Prisma.Decimal(
                          "1.0000",
                        ),
                      unit: "LS",
                      estimatedUnitPrice:
                        new Prisma.Decimal(
                          "1000.0000",
                        ),
                      estimatedTotal:
                        new Prisma.Decimal(
                          "1000.00",
                        ),
                    },
                    {
                      procurementRequestId:
                        requestId,
                      lineNumber: 1,
                      type:
                        ProcurementItemType.MATERIAL,
                      description:
                        "مادة اختبارية",
                      quantity:
                        new Prisma.Decimal(
                          "5.0000",
                        ),
                      unit: "EA",
                      estimatedUnitPrice:
                        new Prisma.Decimal(
                          "300.0000",
                        ),
                      estimatedTotal:
                        new Prisma.Decimal(
                          "1500.00",
                        ),
                    },
                  ],
                );

              const updated =
                await itemRepository.update(
                  transaction,
                  requestId,
                  createdItems[0]!.id,
                  {
                    notes:
                      "تم تحديث العنصر",
                  },
                );

              const listed =
                await itemRepository.findByRequestId(
                  transaction,
                  requestId,
                );

              const deleted =
                await itemRepository.delete(
                  transaction,
                  requestId,
                  createdItems[1]!.id,
                );

              return {
                createdItems,
                updated,
                listed,
                deleted,
              };
            },
          );

        expect(
          result.createdItems.map(
            (item) => item.lineNumber,
          ),
        ).toEqual([1, 2]);

        expect(
          result.updated?.notes,
        ).toBe(
          "تم تحديث العنصر",
        );

        expect(
          result.listed.map(
            (item) => item.lineNumber,
          ),
        ).toEqual([1, 2]);

        expect(result.deleted).toBe(true);
      },
    );

    it(
      "returns null or false for cross-request item access",
      async () => {
        const secondRequest =
          await prisma.$transaction(
            async (transaction) =>
              requestRepository.create(
                transaction,
                {
                  workspaceId,
                  number:
                    `PR-SECOND-${suffix}`,
                  title:
                    "طلب شراء ثانٍ",
                  requestedById:
                    userId,
                  createdById:
                    userId,
                },
              ),
          );

        const remainingItem =
          await prisma.procurementRequestItem.findFirstOrThrow({
            where: {
              procurementRequestId:
                requestId,
            },
          });

        const result =
          await prisma.$transaction(
            async (transaction) => {
              const found =
                await itemRepository.findById(
                  transaction,
                  secondRequest.id,
                  remainingItem.id,
                );

              const updated =
                await itemRepository.update(
                  transaction,
                  secondRequest.id,
                  remainingItem.id,
                  {
                    notes:
                      "يجب ألا يُطبق",
                  },
                );

              const deleted =
                await itemRepository.delete(
                  transaction,
                  secondRequest.id,
                  remainingItem.id,
                );

              return {
                found,
                updated,
                deleted,
              };
            },
          );

        expect(result.found).toBeNull();
        expect(result.updated).toBeNull();
        expect(result.deleted).toBe(false);
      },
    );

    it(
      "rolls back request and items when the transaction fails",
      async () => {
        const rollbackNumber =
          `PR-ROLLBACK-${suffix}`;

        await expect(
          prisma.$transaction(
            async (transaction) => {
              const request =
                await requestRepository.create(
                  transaction,
                  {
                    workspaceId,
                    number:
                      rollbackNumber,
                    title:
                      "طلب يجب التراجع عنه",
                    requestedById:
                      userId,
                    createdById:
                      userId,
                  },
                );

              await itemRepository.create(
                transaction,
                {
                  procurementRequestId:
                    request.id,
                  lineNumber: 1,
                  type:
                    ProcurementItemType.WORK,
                  description:
                    "عنصر يجب التراجع عنه",
                  quantity:
                    new Prisma.Decimal(
                      "1.0000",
                    ),
                  unit: "LS",
                },
              );

              throw new Error(
                "EXPECTED_ROLLBACK",
              );
            },
          ),
        ).rejects.toThrow(
          "EXPECTED_ROLLBACK",
        );

        const persisted =
          await prisma.procurementRequest.findFirst({
            where: {
              workspaceId,
              number:
                rollbackNumber,
            },
            include: {
              items: true,
            },
          });

        expect(persisted).toBeNull();
      },
    );
  },
);
