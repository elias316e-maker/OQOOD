import type {
  WorkspaceBootstrapInput,
  WorkspaceBootstrapResult,
} from "../types/workspace-bootstrap.types";

export class WorkspaceAlreadyExistsError extends Error {
  constructor() {
    super("يمتلك المستخدم مساحة عمل بالفعل.");
    this.name = "WorkspaceAlreadyExistsError";
  }
}

export class WorkspaceIdentityGenerationError extends Error {
  constructor() {
    super("تعذر إنشاء معرف فريد لمساحة العمل.");
    this.name = "WorkspaceIdentityGenerationError";
  }
}

export interface WorkspaceBootstrapService {
  execute(
    userId: string,
    input: WorkspaceBootstrapInput,
  ): Promise<WorkspaceBootstrapResult>;
}
