import { z } from "zod";

const opportunityTypes = [
  "RFQ",
  "RFP",
  "TENDER",
  "DIRECT_PURCHASE",
  "SERVICE_REQUEST",
  "SUBCONTRACT",
] as const;

const opportunityStatuses = [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "PUBLISHED",
  "CLARIFICATION",
  "SUBMISSION_CLOSED",
  "TECHNICAL_EVALUATION",
  "FINANCIAL_EVALUATION",
  "NEGOTIATION",
  "AWARD_PENDING",
  "AWARDED",
  "CANCELLED",
  "CLOSED",
  "ARCHIVED",
] as const;

const opportunityVisibilities = [
  "PRIVATE",
  "INVITED",
  "PUBLIC",
] as const;

const identifierSchema = z
  .string()
  .trim()
  .min(1, "المعرف مطلوب.");

const nullableTrimmedString = z
  .string()
  .trim()
  .transform((value) => value || null)
  .nullable()
  .optional();

const currencySchema = z
  .string()
  .trim()
  .length(3, "رمز العملة يجب أن يتكون من ثلاثة أحرف.")
  .transform((value) => value.toUpperCase());

const prioritySchema = z
  .string()
  .trim()
  .min(1, "الأولوية مطلوبة.")
  .max(30, "الأولوية طويلة جدًا.")
  .transform((value) => value.toUpperCase());

const budgetSchema = z
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

    if (!Number.isFinite(normalized) || normalized < 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "الميزانية يجب أن تكون رقمًا موجبًا.",
      });

      return z.NEVER;
    }

    return normalized.toFixed(2);
  });

const optionalDateSchema = z
  .union([
    z.date(),
    z.string().trim(),
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

    const date =
      value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "صيغة التاريخ غير صالحة.",
      });

      return z.NEVER;
    }

    return date;
  });

const baseActorContextSchema = z.object({
  workspaceId: identifierSchema,
  actorUserId: identifierSchema,
});

const dateRangeValidation = (
  value: {
    issueDate?: Date | null;
    closingDate?: Date | null;
  },
  context: z.RefinementCtx,
): void => {
  if (
    value.issueDate &&
    value.closingDate &&
    value.closingDate <= value.issueDate
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["closingDate"],
      message:
        "تاريخ الإغلاق يجب أن يكون بعد تاريخ الإصدار.",
    });
  }
};

export const createOpportunitySchema =
  baseActorContextSchema
    .extend({
      projectId: identifierSchema.nullable().optional(),
      number: z
        .string()
        .trim()
        .min(2, "رقم الفرصة قصير جدًا.")
        .max(100, "رقم الفرصة طويل جدًا.")
        .transform((value) => value.toUpperCase()),
      title: z
        .string()
        .trim()
        .min(3, "عنوان الفرصة قصير جدًا.")
        .max(250, "عنوان الفرصة طويل جدًا."),
      description: nullableTrimmedString,
      type: z.enum(opportunityTypes),
      visibility: z
        .enum(opportunityVisibilities)
        .default("INVITED"),
      category: nullableTrimmedString,
      priority: prioritySchema.default("NORMAL"),
      budget: budgetSchema,
      currency: currencySchema.default("SAR"),
      issueDate: optionalDateSchema,
      closingDate: optionalDateSchema,
    })
    .superRefine(dateRangeValidation);

export const updateOpportunitySchema =
  baseActorContextSchema
    .extend({
      opportunityId: identifierSchema,
      projectId: identifierSchema.nullable().optional(),
      title: z
        .string()
        .trim()
        .min(3, "عنوان الفرصة قصير جدًا.")
        .max(250, "عنوان الفرصة طويل جدًا.")
        .optional(),
      description: nullableTrimmedString,
      type: z.enum(opportunityTypes).optional(),
      visibility: z
        .enum(opportunityVisibilities)
        .optional(),
      category: nullableTrimmedString,
      priority: prioritySchema.optional(),
      budget: budgetSchema,
      currency: currencySchema.optional(),
      issueDate: optionalDateSchema,
      closingDate: optionalDateSchema,
    })
    .superRefine((value, context) => {
      dateRangeValidation(value, context);

      const mutableFields = [
        "projectId",
        "title",
        "description",
        "type",
        "visibility",
        "category",
        "priority",
        "budget",
        "currency",
        "issueDate",
        "closingDate",
      ] as const;

      const hasUpdate = mutableFields.some(
        (field) => value[field] !== undefined,
      );

      if (!hasUpdate) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "يجب توفير حقل واحد على الأقل للتحديث.",
        });
      }
    });

export const publishOpportunitySchema =
  baseActorContextSchema.extend({
    opportunityId: identifierSchema,
  });

export const archiveOpportunitySchema =
  baseActorContextSchema.extend({
    opportunityId: identifierSchema,
  });

export const listWorkspaceOpportunitiesSchema = z.object({
  workspaceId: identifierSchema,
  actorUserId: identifierSchema,
  status: z.enum(opportunityStatuses).optional(),
  type: z.enum(opportunityTypes).optional(),
  visibility: z
    .enum(opportunityVisibilities)
    .optional(),
  search: z
    .string()
    .trim()
    .max(200, "نص البحث طويل جدًا.")
    .optional()
    .transform((value) => value || undefined),
  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20),
});

export type ValidatedCreateOpportunityInput =
  z.infer<typeof createOpportunitySchema>;

export type ValidatedUpdateOpportunityInput =
  z.infer<typeof updateOpportunitySchema>;

export type ValidatedPublishOpportunityInput =
  z.infer<typeof publishOpportunitySchema>;

export type ValidatedArchiveOpportunityInput =
  z.infer<typeof archiveOpportunitySchema>;

export type ValidatedListWorkspaceOpportunitiesInput =
  z.infer<typeof listWorkspaceOpportunitiesSchema>;
