import { z } from "zod";

const identifierSchema = z
  .string()
  .trim()
  .min(1, "المعرف مطلوب.");

const actorContextSchema = z.object({
  workspaceId: identifierSchema,
  actorUserId: identifierSchema,
});

const nullableScoreSchema = z
  .union([
    z.string().trim(),
    z.number(),
    z.null(),
  ])
  .optional()
  .transform((value, context) => {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return null;
    }

    const normalized = Number(value);

    if (
      !Number.isFinite(normalized) ||
      normalized < 0 ||
      normalized > 100
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "درجة التقييم يجب أن تكون بين 0 و100.",
      });

      return z.NEVER;
    }

    return normalized.toFixed(2);
  });

export const getOfferEvaluationSchema =
  actorContextSchema.extend({
    offerId: identifierSchema,
  });

export const saveOfferCriterionScoreSchema =
  actorContextSchema
    .extend({
      offerId: identifierSchema,
      criterionId: identifierSchema,
      score: nullableScoreSchema,
      passed: z.boolean().nullable().optional(),
      notes: z
        .string()
        .trim()
        .max(2000, "ملاحظات التقييم طويلة جدًا.")
        .transform((value) => value || null)
        .nullable()
        .optional(),
    })
    .superRefine((value, context) => {
      if (
        value.score === null &&
        value.passed === null
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "يجب إدخال درجة أو تحديد نتيجة النجاح أو الرسوب.",
        });
      }
    });

export const completeOfferEvaluationSchema =
  actorContextSchema.extend({
    offerId: identifierSchema,
  });

export type ValidatedSaveOfferCriterionScoreInput =
  z.infer<typeof saveOfferCriterionScoreSchema>;
