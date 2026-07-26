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
  Omit<
    CreateProcurementRequestInput,
    "workspaceId" | "actorUserId" | "requestedById"
  >;

export type UpdateProcurementRequestActionInput =
  WithoutContext<UpdateProcurementRequestInput>;

export type ProcurementRequestCommandActionInput =
  WithoutContext<ProcurementRequestCommandInput>;

export type GetProcurementRequestActionInput =
  WithoutContext<GetProcurementRequestInput>;

export type ListProcurementRequestsActionInput =
  WithoutContext<ListProcurementRequestsInput>;
