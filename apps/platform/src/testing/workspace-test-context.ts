import { prisma } from "@/lib/prisma";

import {
  createTestId,
} from "./test-id";

export type CreateWorkspaceTestContextInput = {
  prefix?: string;
  userName?: string;
  workspaceNameAr?: string;
  workspaceNameEn?: string;
  defaultCurrency?: string;
  roleName?: string;
};

export type WorkspaceTestContext = {
  uniqueId: string;
  userId: string;
  workspaceId: string;
  workspaceMemberId: string;
  roleId: string;
};

function normalizeCodePart(
  value: string,
): string {
  return value
    .replace(/[^a-zA-Z0-9-]/g, "-")
    .toUpperCase();
}

export async function createWorkspaceTestContext(
  input: CreateWorkspaceTestContextInput = {},
): Promise<WorkspaceTestContext> {
  const prefix =
    input.prefix?.trim() || "shared-test";

  const uniqueId = createTestId();
  const normalizedPrefix =
    normalizeCodePart(prefix);

  const user = await prisma.user.create({
    data: {
      name:
        input.userName ??
        "Shared Test User",
      email:
        `${prefix}-${uniqueId}` +
        "@example.test",
      emailVerified: true,
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  const workspace =
    await prisma.workspace.create({
      data: {
        code:
          `${normalizedPrefix}-${uniqueId}`
            .toUpperCase(),
        slug:
          `${prefix}-${uniqueId}`
            .toLowerCase(),
        nameAr:
          input.workspaceNameAr ??
          "مساحة اختبار مشتركة",
        nameEn:
          input.workspaceNameEn ??
          "Shared Test Workspace",
        status: "ACTIVE",
        defaultCurrency:
          input.defaultCurrency ?? "SAR",
        createdById: user.id,
      },
      select: {
        id: true,
      },
    });

  const membership =
    await prisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        status: "ACTIVE",
      },
      select: {
        id: true,
      },
    });

  const role = await prisma.role.create({
    data: {
      workspaceId: workspace.id,
      code:
        `${normalizedPrefix}-ROLE-${uniqueId}`
          .toUpperCase(),
      name:
        input.roleName ??
        "Shared Test Role",
      isSystem: false,
    },
    select: {
      id: true,
    },
  });

  await prisma.workspaceMemberRole.create({
    data: {
      workspaceMemberId:
        membership.id,
      roleId: role.id,
    },
  });

  return {
    uniqueId,
    userId: user.id,
    workspaceId: workspace.id,
    workspaceMemberId:
      membership.id,
    roleId: role.id,
  };
}
