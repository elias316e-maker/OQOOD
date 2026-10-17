import {
  z,
} from "zod";

const identifierSchema = z
  .string()
  .trim()
  .min(1, "المعرف مطلوب.");

export const awardRecommendationSchema =
  z.object({
    workspaceId: identifierSchema,
    actorUserId: identifierSchema,
    opportunityId: identifierSchema,
    offerId: identifierSchema,
    justification: z
      .string()
      .trim()
      .max(
        2000,
        "يجب ألا تتجاوز مبررات الترسية 2000 حرف.",
      )
      .nullable()
      .optional(),
  });
