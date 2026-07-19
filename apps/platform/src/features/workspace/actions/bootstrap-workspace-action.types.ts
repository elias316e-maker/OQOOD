export type BootstrapWorkspaceActionState =
  | {
      status: "idle";
      message?: undefined;
      fieldErrors?: undefined;
      workspaceSlug?: undefined;
    }
  | {
      status: "error";
      message: string;
      fieldErrors?: Record<string, string>;
      workspaceSlug?: undefined;
    }
  | {
      status: "success";
      message: string;
      fieldErrors?: undefined;
      workspaceSlug: string;
    };

export const INITIAL_BOOTSTRAP_WORKSPACE_ACTION_STATE:
  BootstrapWorkspaceActionState = {
    status: "idle",
  };
