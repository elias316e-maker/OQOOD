import {
  requireWorkspaceWriteAccess,
} from "@/lib/access";

import {
  requireWorkspace,
} from "./require-workspace";

export async function requireWorkspaceWriteContext() {
  const context =
    await requireWorkspace();

  const writeAccess =
    requireWorkspaceWriteAccess(
      context.access,
    );

  return {
    ...context,
    writeAccess,
  };
}

export type RequiredWorkspaceWriteContext =
  Awaited<
    ReturnType<
      typeof requireWorkspaceWriteContext
    >
  >;
