import type {
  CreateProcurementRequestInput,
  GetProcurementRequestInput,
  ListProcurementRequestsInput,
  ProcurementRequestCommandInput,
  ProcurementRequestListResponse,
  ProcurementRequestResponse,
  UpdateProcurementRequestInput,
} from "../dtos";

export interface ProcurementApplicationService {
  create(
    input: CreateProcurementRequestInput,
  ): Promise<ProcurementRequestResponse>;

  update(
    input: UpdateProcurementRequestInput,
  ): Promise<ProcurementRequestResponse>;

  getById(
    input: GetProcurementRequestInput,
  ): Promise<ProcurementRequestResponse>;

  list(
    input: ListProcurementRequestsInput,
  ): Promise<ProcurementRequestListResponse>;

  submit(
    input: ProcurementRequestCommandInput,
  ): Promise<ProcurementRequestResponse>;

  startReview(
    input: ProcurementRequestCommandInput,
  ): Promise<ProcurementRequestResponse>;

  requestChanges(
    input: ProcurementRequestCommandInput,
  ): Promise<ProcurementRequestResponse>;

  approve(
    input: ProcurementRequestCommandInput,
  ): Promise<ProcurementRequestResponse>;

  reject(
    input: ProcurementRequestCommandInput,
  ): Promise<ProcurementRequestResponse>;

  cancel(
    input: ProcurementRequestCommandInput,
  ): Promise<ProcurementRequestResponse>;

  archive(
    input: ProcurementRequestCommandInput,
  ): Promise<ProcurementRequestResponse>;
}
