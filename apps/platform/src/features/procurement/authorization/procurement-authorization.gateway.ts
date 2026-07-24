import type {
  PermissionCode,
} from "@/lib/permissions";

import type {
  ProcurementTransactionClient,
} from "../repositories";

export type ProcurementAuthorizationContext = {
  workspaceId: string;
  actorUserId: string;
  permission: PermissionCode;
  requireWriteAccess: boolean;
};

export type AuthorizedProcurementContext = {
  workspaceId: string;
  actorUserId: string;
  defaultCurrency: string;
};

export interface ProcurementAuthorizationGateway {
  authorize(
    transaction: ProcurementTransactionClient,
    input: ProcurementAuthorizationContext,
  ): Promise<AuthorizedProcurementContext>;
}
