import type {
  PermissionCode,
} from "@/lib/permissions";

import type {
  OpportunityTransactionClient,
} from "../repositories";

export type OpportunityAuthorizationContext = {
  workspaceId: string;
  actorUserId: string;
  permission: PermissionCode;
  requireWriteAccess: boolean;
};

export type AuthorizedOpportunityContext = {
  workspaceId: string;
  actorUserId: string;
  defaultCurrency: string;
};

export interface OpportunityAuthorizationGateway {
  authorize(
    transaction: OpportunityTransactionClient,
    input: OpportunityAuthorizationContext,
  ): Promise<AuthorizedOpportunityContext>;
}
