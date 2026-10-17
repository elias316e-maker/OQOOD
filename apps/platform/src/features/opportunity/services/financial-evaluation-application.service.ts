import type {
  CompleteFinancialEvaluationRequest,
  FinancialEvaluationResponse,
  GetFinancialEvaluationRequest,
  RecommendFinancialAwardRequest,
} from "../dtos";

export interface FinancialEvaluationApplicationService {
  get(
    request: GetFinancialEvaluationRequest,
  ): Promise<FinancialEvaluationResponse>;

  complete(
    request: CompleteFinancialEvaluationRequest,
  ): Promise<FinancialEvaluationResponse>;

  recommendAward(
    request: RecommendFinancialAwardRequest,
  ): Promise<FinancialEvaluationResponse>;
}
