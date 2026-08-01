import type {
  OpportunityCriterionCategory,
  OpportunityCriterionScoringMethod,
} from "@/generated/prisma/client";

export type OpportunityCriterionResponse = {
  id: string;
  opportunityId: string;
  name: string;
  description: string | null;
  category: OpportunityCriterionCategory;
  scoringMethod: OpportunityCriterionScoringMethod;
  weight: string;
  minimumScore: string | null;
  required: boolean;
  active: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type OpportunityCriteriaListResponse = {
  criteria: OpportunityCriterionResponse[];
  totalWeight: string;
};

export type ListOpportunityCriteriaRequest = {
  workspaceId: string;
  actorUserId: string;
  opportunityId: string;
};

export type CreateOpportunityCriterionRequest = {
  workspaceId: string;
  actorUserId: string;
  opportunityId: string;
  name: string;
  description?: string | null;
  category: OpportunityCriterionCategory;
  scoringMethod: OpportunityCriterionScoringMethod;
  weight: string | number;
  minimumScore?: string | number | null;
  required?: boolean;
  active?: boolean;
  displayOrder?: number;
};

export type UpdateOpportunityCriterionRequest = {
  workspaceId: string;
  actorUserId: string;
  opportunityId: string;
  criterionId: string;
  name?: string;
  description?: string | null;
  category?: OpportunityCriterionCategory;
  scoringMethod?: OpportunityCriterionScoringMethod;
  weight?: string | number;
  minimumScore?: string | number | null;
  required?: boolean;
  active?: boolean;
  displayOrder?: number;
};

export type DeleteOpportunityCriterionRequest = {
  workspaceId: string;
  actorUserId: string;
  opportunityId: string;
  criterionId: string;
};
