import type { Prisma } from "@/generated/prisma/client";

import {
  PrismaWorkspaceRepository,
  type WorkspaceRepository,
} from "@/features/workspace/repositories";
import type {
  WorkspaceBootstrapBillingResult,
  WorkspaceBootstrapCoreResult,
} from "@/features/workspace/types";

export class ThrowingAuditWorkspaceRepository
  extends PrismaWorkspaceRepository
  implements WorkspaceRepository
{
  override async createBootstrapAuditLog(
    _transaction: Prisma.TransactionClient,
    _input: {
      userId: string;
      core: WorkspaceBootstrapCoreResult;
      billing: WorkspaceBootstrapBillingResult;
    },
  ): Promise<void> {
    throw new Error("Injected AuditLog Failure");
  }
}
