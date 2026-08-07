import type {
  AwardRecommendationRequest,
  AwardRecommendationResponse,
} from "../dtos";

export interface AwardRecommendationApplicationService {
  recommend(
    request: AwardRecommendationRequest,
  ): Promise<AwardRecommendationResponse>;
}
