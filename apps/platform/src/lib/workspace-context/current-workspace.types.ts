import type {
  CurrentWorkspaceRecord,
} from "./current-workspace.repository";

export type CurrentWorkspaceContext =
  CurrentWorkspaceRecord;

export type CurrentWorkspace =
  CurrentWorkspaceContext["workspace"];

export type CurrentWorkspaceMembership = Omit<
  CurrentWorkspaceContext,
  "workspace"
>;

export type CurrentWorkspaceRole =
  CurrentWorkspaceContext["roles"][number]["role"];

export type CurrentWorkspaceRolePermission =
  CurrentWorkspaceRole["permissions"][number];

export type CurrentWorkspacePermission =
  CurrentWorkspaceRolePermission["permission"];

export type CurrentWorkspaceSubscription =
  CurrentWorkspace["subscription"];
