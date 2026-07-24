import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const currentWorkspaceSelect = {
  id: true,
  status: true,
  joinedAt: true,

  roles: {
    select: {
      role: {
        select: {
          id: true,
          code: true,
          name: true,
          isSystem: true,

          permissions: {
            select: {
              permission: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  description: true,
                },
              },
            },
          },
        },
      },
    },
  },

  workspace: {
    select: {
      id: true,
      code: true,
      slug: true,
      nameAr: true,
      nameEn: true,
      status: true,
      defaultLanguage: true,
      defaultCurrency: true,
      timezone: true,

      billingAccount: {
        select: {
          id: true,
          legalName: true,
          billingEmail: true,
          currency: true,
          countryCode: true,
        },
      },

      subscription: {
        select: {
          id: true,
          status: true,
          accessState: true,
          source: true,
          trialStartsAt: true,
          trialEndsAt: true,
          currentPeriodStartsAt: true,
          currentPeriodEndsAt: true,

          plan: {
            select: {
              id: true,
              code: true,
              version: true,
              nameAr: true,
              nameEn: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.WorkspaceMemberSelect;

export type CurrentWorkspaceRecord =
  Prisma.WorkspaceMemberGetPayload<{
    select: typeof currentWorkspaceSelect;
  }>;

export interface CurrentWorkspaceRepository {
  findForUser(
    userId: string,
  ): Promise<CurrentWorkspaceRecord | null>;
}

export class PrismaCurrentWorkspaceRepository
  implements CurrentWorkspaceRepository
{
  async findForUser(
    userId: string,
  ): Promise<CurrentWorkspaceRecord | null> {
    return prisma.workspaceMember.findFirst({
      where: {
        userId,
        status: "ACTIVE",
        workspace: {
          status: {
            in: ["ACTIVE", "DRAFT"],
          },
        },
      },

      orderBy: {
        joinedAt: "asc",
      },

      select: currentWorkspaceSelect,
    });
  }
}
