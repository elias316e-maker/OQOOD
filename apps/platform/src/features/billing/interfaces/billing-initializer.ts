import type { Prisma } from "@/generated/prisma/client";

import type {
  InitializeWorkspaceTrialInput,
  InitializeWorkspaceTrialResult,
} from "../types/workspace-trial.types";

export interface BillingInitializer {
  initialize(
    transaction: Prisma.TransactionClient,
    input: InitializeWorkspaceTrialInput,
  ): Promise<InitializeWorkspaceTrialResult>;
}
