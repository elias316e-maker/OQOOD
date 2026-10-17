export class WorkspaceBillingAlreadyInitializedError extends Error {
  constructor(workspaceId: string) {
    super(
      `Workspace billing is already initialized with incompatible data: ${workspaceId}`,
    );
    this.name = "WorkspaceBillingAlreadyInitializedError";
  }
}

export class TrialPlanNotAvailableError extends Error {
  constructor() {
    super("The PROFESSIONAL v1 trial plan is not available.");
    this.name = "TrialPlanNotAvailableError";
  }
}
