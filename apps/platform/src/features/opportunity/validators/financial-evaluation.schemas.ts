import { z } from "zod";

const identifierSchema = z
  .string()
  .trim()
  .min(1, "المعرف مطلوب.");

const actorContextSchema = z.object({
  workspaceId: identifierSchema,
  actorUserId: identifierSchema,
});

export const getFinancialEvaluationSchema =
  actorContextSchema.extend({
    opportunityId: identifierSchema,
  });

export const completeFinancialEvaluationSchema =
  actorContextSchema.extend({
    opportunityId: identifierSchema,
  });

export const recommendFinancialAwardSchema =
  actorContextSchema.extend({
    opportunityId: identifierSchema,
  });
