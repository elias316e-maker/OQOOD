import "dotenv/config";

import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { PrismaOpportunityRepository } from "../repositories";

function createUniqueId(): string {
  return [
    Date.now(),
    Math.random().toString(36).slice(2, 10),
  ].join("-");
}

describe.sequential(
  "Opportunity Repository Integration",
  () => {
    const repository =
      new PrismaOpportunityRepository();

    const createdUserIds = new Set<string>();
    const createdWorkspaceIds = new Set<string>();

    let workspaceOneId: string;
    let workspaceTwoId: string;
    let userOneId: string;
    let userTwoId: string;

    beforeAll(async () => {
      const uniqueId = createUniqueId();

      const [userOne, userTwo] = await Promise.all([
        prisma.user.create({
          data: {
            name: "Opportunity Repository User One",
            email:
              `opportunity-repository-user-one-${uniqueId}` +
              "@example.test",
            emailVerified: true,
            isActive: true,
          },
          select: {
            id: true,
          },
        }),

        prisma.user.create({
          data: {
            name: "Opportunity Repository User Two",
            email:
              `opportunity-repository-user-two-${uniqueId}` +
              "@example.test",
            emailVerified: true,
            isActive: true,
          },
          select: {
            id: true,
          },
        }),
      ]);

      userOneId = userOne.id;
      userTwoId = userTwo.id;

      createdUserIds.add(userOneId);
      createdUserIds.add(userTwoId);

      const [workspaceOne, workspaceTwo] =
        await Promise.all([
          prisma.workspace.create({
            data: {
              code: `OPP-W1-${uniqueId}`,
              slug: `opp-workspace-one-${uniqueId}`,
              nameAr: "مساحة اختبار فرص أولى",
              nameEn:
                "Opportunity Repository Workspace One",
              countryCode: "SA",
              timezone: "Asia/Riyadh",
              defaultLanguage: "ar",
              defaultCurrency: "SAR",
              status: "ACTIVE",
              createdById: userOneId,
            },
            select: {
              id: true,
            },
          }),

          prisma.workspace.create({
            data: {
              code: `OPP-W2-${uniqueId}`,
              slug: `opp-workspace-two-${uniqueId}`,
              nameAr: "مساحة اختبار فرص ثانية",
              nameEn:
                "Opportunity Repository Workspace Two",
              countryCode: "SA",
              timezone: "Asia/Riyadh",
              defaultLanguage: "ar",
              defaultCurrency: "SAR",
              status: "ACTIVE",
              createdById: userTwoId,
            },
            select: {
              id: true,
            },
          }),
        ]);

      workspaceOneId = workspaceOne.id;
      workspaceTwoId = workspaceTwo.id;

      createdWorkspaceIds.add(workspaceOneId);
      createdWorkspaceIds.add(workspaceTwoId);
    });

    afterAll(async () => {
      if (createdWorkspaceIds.size > 0) {
        await prisma.workspace.deleteMany({
          where: {
            id: {
              in: [...createdWorkspaceIds],
            },
          },
        });
      }

      if (createdUserIds.size > 0) {
        await prisma.user.deleteMany({
          where: {
            id: {
              in: [...createdUserIds],
            },
          },
        });
      }

      await prisma.$disconnect();
    });

    it(
      "creates and retrieves an opportunity by id and number",
      async () => {
        const created = await prisma.$transaction(
          async (transaction) => {
            return repository.create(transaction, {
              workspaceId: workspaceOneId,
              number: `RFQ-${createUniqueId()}`,
              title: "توريد مواد أعمال مدنية",
              description:
                "توريد مواد خرسانية لمشروع داخل الرياض",
              type: "RFQ",
              status: "DRAFT",
              visibility: "INVITED",
              priority: "HIGH",
              budget: new Prisma.Decimal("250000.00"),
              currency: "SAR",
              createdById: userOneId,
            });
          },
        );

        const result = await prisma.$transaction(
          async (transaction) => {
            const byId = await repository.findById(
              transaction,
              workspaceOneId,
              created.id,
            );

            const byNumber =
              await repository.findByNumber(
                transaction,
                workspaceOneId,
                created.number,
              );

            return {
              byId,
              byNumber,
            };
          },
        );

        expect(result.byId).not.toBeNull();
        expect(result.byNumber).not.toBeNull();

        expect(result.byId).toMatchObject({
          id: created.id,
          workspaceId: workspaceOneId,
          number: created.number,
          title: "توريد مواد أعمال مدنية",
          type: "RFQ",
          status: "DRAFT",
          visibility: "INVITED",
          priority: "HIGH",
          currency: "SAR",
          createdById: userOneId,
        });

        expect(result.byNumber?.id).toBe(created.id);
        expect(result.byId?.budget?.toString()).toBe(
          "250000",
        );
      },
    );

    it(
      "isolates findById and findByNumber by workspace",
      async () => {
        const created = await prisma.$transaction(
          async (transaction) => {
            return repository.create(transaction, {
              workspaceId: workspaceOneId,
              number: `RFP-${createUniqueId()}`,
              title: "فرصة خاصة بمساحة العمل الأولى",
              type: "RFP",
              createdById: userOneId,
            });
          },
        );

        const result = await prisma.$transaction(
          async (transaction) => {
            const byId = await repository.findById(
              transaction,
              workspaceTwoId,
              created.id,
            );

            const byNumber =
              await repository.findByNumber(
                transaction,
                workspaceTwoId,
                created.number,
              );

            return {
              byId,
              byNumber,
            };
          },
        );

        expect(result.byId).toBeNull();
        expect(result.byNumber).toBeNull();
      },
    );

    it(
      "allows the same opportunity number in different workspaces",
      async () => {
        const sharedNumber =
          `SHARED-${createUniqueId()}`;

        const [opportunityOne, opportunityTwo] =
          await prisma.$transaction(
            async (transaction) => {
              const first = await repository.create(
                transaction,
                {
                  workspaceId: workspaceOneId,
                  number: sharedNumber,
                  title: "فرصة المساحة الأولى",
                  type: "TENDER",
                  createdById: userOneId,
                },
              );

              const second = await repository.create(
                transaction,
                {
                  workspaceId: workspaceTwoId,
                  number: sharedNumber,
                  title: "فرصة المساحة الثانية",
                  type: "TENDER",
                  createdById: userTwoId,
                },
              );

              return [first, second];
            },
          );

        expect(opportunityOne.number).toBe(
          sharedNumber,
        );

        expect(opportunityTwo.number).toBe(
          sharedNumber,
        );

        expect(opportunityOne.workspaceId).not.toBe(
          opportunityTwo.workspaceId,
        );
      },
    );

    it(
      "lists and counts opportunities only within the requested workspace",
      async () => {
        const marker = createUniqueId();

        await prisma.$transaction(
          async (transaction) => {
            await repository.create(transaction, {
              workspaceId: workspaceOneId,
              number: `LIST-A-${marker}`,
              title: `قائمة مشتريات ${marker}`,
              type: "DIRECT_PURCHASE",
              status: "DRAFT",
              visibility: "PRIVATE",
              createdById: userOneId,
            });

            await repository.create(transaction, {
              workspaceId: workspaceOneId,
              number: `LIST-B-${marker}`,
              title: `خدمات صيانة ${marker}`,
              type: "SERVICE_REQUEST",
              status: "PUBLISHED",
              visibility: "PUBLIC",
              createdById: userOneId,
            });

            await repository.create(transaction, {
              workspaceId: workspaceTwoId,
              number: `LIST-C-${marker}`,
              title: `فرصة خارجية ${marker}`,
              type: "SERVICE_REQUEST",
              status: "PUBLISHED",
              visibility: "PUBLIC",
              createdById: userTwoId,
            });
          },
        );

        const result = await prisma.$transaction(
          async (transaction) => {
            const listed =
              await repository.listByWorkspace(
                transaction,
                {
                  workspaceId: workspaceOneId,
                  filters: {
                    search: marker,
                  },
                },
              );

            const count =
              await repository.countByWorkspace(
                transaction,
                workspaceOneId,
                {
                  search: marker,
                },
              );

            return {
              listed,
              count,
            };
          },
        );

        expect(result.listed).toHaveLength(2);
        expect(result.count).toBe(2);

        expect(
          result.listed.every(
            (opportunity) =>
              opportunity.workspaceId ===
              workspaceOneId,
          ),
        ).toBe(true);
      },
    );

    it(
      "filters opportunities by status, type, visibility, and search",
      async () => {
        const marker = createUniqueId();

        await prisma.$transaction(
          async (transaction) => {
            await repository.create(transaction, {
              workspaceId: workspaceOneId,
              number: `FILTER-A-${marker}`,
              title: `أعمال شبكات ${marker}`,
              description:
                "فرصة متخصصة في تنفيذ شبكات الري",
              type: "SUBCONTRACT",
              status: "PUBLISHED",
              visibility: "INVITED",
              createdById: userOneId,
            });

            await repository.create(transaction, {
              workspaceId: workspaceOneId,
              number: `FILTER-B-${marker}`,
              title: `توريد معدات ${marker}`,
              description:
                "فرصة مختلفة لاختبار التصفية",
              type: "RFQ",
              status: "DRAFT",
              visibility: "PRIVATE",
              createdById: userOneId,
            });
          },
        );

        const result = await prisma.$transaction(
          async (transaction) => {
            return repository.listByWorkspace(
              transaction,
              {
                workspaceId: workspaceOneId,
                filters: {
                  status: "PUBLISHED",
                  type: "SUBCONTRACT",
                  visibility: "INVITED",
                  search: "شبكات الري",
                },
              },
            );
          },
        );

        expect(result).toHaveLength(1);

        expect(result[0]).toMatchObject({
          workspaceId: workspaceOneId,
          number: `FILTER-A-${marker}`,
          type: "SUBCONTRACT",
          status: "PUBLISHED",
          visibility: "INVITED",
        });
      },
    );

    it(
      "updates an opportunity only in its owning workspace",
      async () => {
        const created = await prisma.$transaction(
          async (transaction) => {
            return repository.create(transaction, {
              workspaceId: workspaceOneId,
              number: `UPDATE-${createUniqueId()}`,
              title: "عنوان قبل التعديل",
              type: "RFQ",
              status: "DRAFT",
              createdById: userOneId,
            });
          },
        );

        const result = await prisma.$transaction(
          async (transaction) => {
            const denied = await repository.update(
              transaction,
              workspaceTwoId,
              created.id,
              {
                title: "تعديل غير مسموح",
              },
            );

            const updated = await repository.update(
              transaction,
              workspaceOneId,
              created.id,
              {
                title: "عنوان بعد التعديل",
                description:
                  "تم تحديث وصف الفرصة بنجاح",
                category: "CONSTRUCTION",
                priority: "URGENT",
                status: "PUBLISHED",
                publishedAt: new Date(),
              },
            );

            return {
              denied,
              updated,
            };
          },
        );

        expect(result.denied).toBeNull();

        expect(result.updated).toMatchObject({
          id: created.id,
          workspaceId: workspaceOneId,
          title: "عنوان بعد التعديل",
          description:
            "تم تحديث وصف الفرصة بنجاح",
          category: "CONSTRUCTION",
          priority: "URGENT",
          status: "PUBLISHED",
        });

        expect(
          result.updated?.publishedAt,
        ).toBeInstanceOf(Date);
      },
    );

    it(
      "applies pagination limits safely",
      async () => {
        const marker = createUniqueId();

        await prisma.$transaction(
          async (transaction) => {
            for (let index = 1; index <= 3; index += 1) {
              await repository.create(transaction, {
                workspaceId: workspaceOneId,
                number:
                  `PAGE-${marker}-${index}`,
                title:
                  `فرصة ترقيم ${marker} رقم ${index}`,
                type: "RFQ",
                createdById: userOneId,
              });
            }
          },
        );

        const result = await prisma.$transaction(
          async (transaction) => {
            return repository.listByWorkspace(
              transaction,
              {
                workspaceId: workspaceOneId,
                filters: {
                  search: marker,
                },
                limit: 2,
                offset: 1,
              },
            );
          },
        );

        expect(result).toHaveLength(2);

        expect(
          result.every(
            (opportunity) =>
              opportunity.workspaceId ===
              workspaceOneId,
          ),
        ).toBe(true);
      },
    );
  },
);
