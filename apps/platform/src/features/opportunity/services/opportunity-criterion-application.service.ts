import type {
  CreateOpportunityCriterionRequest,
  DeleteOpportunityCriterionRequest,
  ListOpportunityCriteriaRequest,
  OpportunityCriteriaListResponse,
  OpportunityCriterionResponse,
  UpdateOpportunityCriterionRequest,
} from "../dtos";

export interface OpportunityCriterionApplicationService {
  list(
    request: ListOpportunityCriteriaRequest,
  ): Promise<OpportunityCriteriaListResponse>;

  create(
    request: CreateOpportunityCriterionRequest,
  ): Promise<OpportunityCriterionResponse>;

  update(
    request: UpdateOpportunityCriterionRequest,
  ): Promise<OpportunityCriterionResponse>;

  delete(
    request: DeleteOpportunityCriterionRequest,
  ): Promise<void>;
}
