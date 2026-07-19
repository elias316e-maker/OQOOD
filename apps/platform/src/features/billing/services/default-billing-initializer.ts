import type { Prisma } from "@/generated/prisma/client";

import type { BillingInitializer } from "../interfaces/billing-initializer";
import type {
  InitializeWorkspaceTrialInput,
  InitializeWorkspaceTrialResult,
} from "../types/workspace-trial.types";
import { initializeWorkspaceTrial } from "./initialize-workspace-trial";

export class DefaultBillingInitializer
  implements BillingInitializer
{
  async initialize(
    transaction: Prisma.TransactionClient,
    input: InitializeWorkspaceTrialInput,
  ): Promise<InitializeWorkspaceTrialResult> {
    return initializeWorkspaceTrial(
      transaction,
      input,
    );
  }
}
