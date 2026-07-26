import type {
  CreateProcurementRequestInput,
  GetProcurementRequestInput,
  ListProcurementRequestsInput,
  ProcurementRequestCommandInput,
  UpdateProcurementRequestInput,
} from "../dtos";

type WithoutContext<T> = Omit<
  T,
  "workspaceId" | "actorUserId"
>;

export type CreateProcurementRequestActionInput =
  WithoutContext<CreateProcurementRequestInput>;

export type UpdateProcurementRequestActionInput =
  WithoutContext<UpdateProcurementRequestInput>;

export type ProcurementRequestCommandActionInput =
  WithoutContext<ProcurementRequestCommandInput>;

export type GetProcurementRequestActionInput =
  WithoutContext<GetProcurementRequestInput>;

export type ListProcurementRequestsActionInput =
  WithoutContext<ListProcurementRequestsInput>;

