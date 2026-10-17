import { z } from "zod";

const criterionCategories = [
  "TECHNICAL",
  "FINANCIAL",
  "COMMERCIAL",
  "COMPLIANCE",
  "DOCUMENT",
  "CUSTOM",
] as const;

const scoringMethods = [
  "PASS_FAIL",
  "NUMERIC",
  "PERCENTAGE",
  "MANUAL",
] as const;

const identifierSchema = z
  .string()
  .trim()
  .min(1, "المعرف مطلوب.");

const actorContextSchema = z.object({
  workspaceId: identifierSchema,
  actorUserId: identifierSchema,
});

const decimalScoreSchema = z
  .union([
    z.string().trim(),
    z.number(),
  ])
  .transform((value, context) => {
    const number = Number(value);

    if (
      !Number.isFinite(number) ||
      number < 0 ||
      number > 100
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "القيمة يجب أن تكون بين 0 و100.",
      });

      return z.NEVER;
    }

    return number.toFixed(2);
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

    const number = Number(value);

    if (
      !Number.isFinite(number) ||
      number < 0 ||
      number > 100
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "الحد الأدنى يجب أن يكون بين 0 و100.",
      });

      return z.NEVER;
    }

    return number.toFixed(2);
  });

const baseCriterionFields = {
  name: z
    .string()
    .trim()
    .min(2, "اسم المعيار قصير جدًا.")
    .max(150, "اسم المعيار طويل جدًا."),

  description: z
    .string()
    .trim()
    .max(1000, "وصف المعيار طويل جدًا.")
    .transform((value) => value || null)
    .nullable()
    .optional(),

  category: z.enum(criterionCategories),

  scoringMethod: z.enum(scoringMethods),

  weight: decimalScoreSchema,

  minimumScore: nullableScoreSchema,

  required: z.boolean().default(false),

  active: z.boolean().default(true),

  displayOrder: z.coerce
    .number()
    .int()
    .min(0, "ترتيب العرض غير صالح.")
    .max(10000, "ترتيب العرض مرتفع جدًا.")
    .default(0),
};

export const listOpportunityCriteriaSchema =
  actorContextSchema.extend({
    opportunityId: identifierSchema,
  });

export const createOpportunityCriterionSchema =
  actorContextSchema
    .extend({
      opportunityId: identifierSchema,
      ...baseCriterionFields,
    })
    .superRefine((value, context) => {
      if (
        value.scoringMethod === "PASS_FAIL" &&
        value.minimumScore !== null
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["minimumScore"],
          message:
            "معيار النجاح أو الرسوب لا يحتاج حدًا أدنى رقميًا.",
        });
      }
    });

export const updateOpportunityCriterionSchema =
  actorContextSchema
    .extend({
      opportunityId: identifierSchema,
      criterionId: identifierSchema,
      name: baseCriterionFields.name.optional(),
      description:
        baseCriterionFields.description,
      category:
        baseCriterionFields.category.optional(),
      scoringMethod:
        baseCriterionFields.scoringMethod.optional(),
      weight:
        baseCriterionFields.weight.optional(),
      minimumScore: nullableScoreSchema,
      required: z.boolean().optional(),
      active: z.boolean().optional(),
      displayOrder:
        baseCriterionFields.displayOrder.optional(),
    })
    .superRefine((value, context) => {
      const mutableFields = [
        "name",
        "description",
        "category",
        "scoringMethod",
        "weight",
        "minimumScore",
        "required",
        "active",
        "displayOrder",
      ] as const;

      const hasUpdate = mutableFields.some(
        (field) =>
          Object.prototype.hasOwnProperty.call(
            value,
            field,
          ),
      );

      if (!hasUpdate) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "يجب توفير حقل واحد على الأقل لتحديث المعيار.",
        });
      }

      if (
        value.scoringMethod === "PASS_FAIL" &&
        value.minimumScore !== undefined &&
        value.minimumScore !== null
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["minimumScore"],
          message:
            "معيار النجاح أو الرسوب لا يحتاج حدًا أدنى رقميًا.",
        });
      }
    });

export const deleteOpportunityCriterionSchema =
  actorContextSchema.extend({
    opportunityId: identifierSchema,
    criterionId: identifierSchema,
  });

export type ValidatedCreateOpportunityCriterionInput =
  z.infer<typeof createOpportunityCriterionSchema>;

export type ValidatedUpdateOpportunityCriterionInput =
  z.infer<typeof updateOpportunityCriterionSchema>;
