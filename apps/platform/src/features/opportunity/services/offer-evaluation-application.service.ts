import type {
  CompleteOfferEvaluationRequest,
  GetOfferEvaluationRequest,
  OfferEvaluationResponse,
  SaveOfferCriterionScoreRequest,
} from "../dtos";

export interface OfferEvaluationApplicationService {
  get(
    request: GetOfferEvaluationRequest,
  ): Promise<OfferEvaluationResponse>;

  saveScore(
    request: SaveOfferCriterionScoreRequest,
  ): Promise<OfferEvaluationResponse>;

  complete(
    request: CompleteOfferEvaluationRequest,
  ): Promise<OfferEvaluationResponse>;
}
