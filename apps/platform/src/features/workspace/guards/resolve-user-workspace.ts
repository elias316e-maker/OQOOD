import { prisma } from "@/lib/prisma";

export async function resolveUserWorkspace(userId: string) {
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
    select: {
      id: true,
      status: true,
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
          subscription: {
            select: {
              id: true,
              status: true,
              accessState: true,
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
    },
  });
}

export type ResolvedUserWorkspace = NonNullable<
  Awaited<ReturnType<typeof resolveUserWorkspace>>
>;
