import {
  PermissionDeniedError,
} from "@/lib/permissions";

import {
  WorkspaceAccessDeniedError,
  WorkspaceWriteAccessDeniedError,
} from "@/lib/access";

import type {
  AuthorizedProcurementContext,
  ProcurementAuthorizationContext,
  ProcurementAuthorizationGateway,
} from "./procurement-authorization.gateway";

import type {
  ProcurementTransactionClient,
} from "../repositories";

export class PrismaProcurementAuthorizationGateway
  implements ProcurementAuthorizationGateway
{
  async authorize(
    transaction: ProcurementTransactionClient,
    input: ProcurementAuthorizationContext,
  ): Promise<AuthorizedProcurementContext> {
    const membership =
      await transaction.workspaceMember.findFirst({
        where: {
          userId: input.actorUserId,
          workspaceId: input.workspaceId,
          status: "ACTIVE",
        },

        select: {
          workspace: {
            select: {
              id: true,
              status: true,
              defaultCurrency: true,

              subscription: {
                select: {
                  accessState: true,
                },
              },
            },
          },

          roles: {
            select: {
              role: {
                select: {
                  permissions: {
                    select: {
                      permission: {
                        select: {
                          code: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

    if (!membership) {
      throw new PermissionDeniedError(
        input.permission,
      );
    }

    const workspace = membership.workspace;

    if (
      workspace.status !== "ACTIVE" ||
      !workspace.subscription
    ) {
      throw new WorkspaceAccessDeniedError(
        "BLOCKED",
        !workspace.subscription
          ? "SUBSCRIPTION_MISSING"
          : "WORKSPACE_INACTIVE",
      );
    }

    const accessState =
      workspace.subscription.accessState;

    if (accessState === "BLOCKED") {
      throw new WorkspaceAccessDeniedError(
        "BLOCKED",
        "SUBSCRIPTION_BLOCKED",
      );
    }

    if (input.requireWriteAccess) {
      if (accessState === "READ_ONLY") {
        throw new WorkspaceWriteAccessDeniedError(
          "WORKSPACE_READ_ONLY",
        );
      }

      if (accessState === "RESTRICTED") {
        throw new WorkspaceWriteAccessDeniedError(
          "WORKSPACE_RESTRICTED",
        );
      }
    }

    const permissionCodes = new Set(
      membership.roles.flatMap(
        (assignment) =>
          assignment.role.permissions.map(
            (rolePermission) =>
              rolePermission.permission.code,
          ),
      ),
    );

    if (!permissionCodes.has(input.permission)) {
      throw new PermissionDeniedError(
        input.permission,
      );
    }

    return {
      workspaceId: workspace.id,
      actorUserId: input.actorUserId,
      defaultCurrency:
        workspace.defaultCurrency,
    };
  }
}
