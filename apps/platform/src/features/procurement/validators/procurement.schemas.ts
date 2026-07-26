import { z } from "zod";

const statuses = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "CHANGES_REQUESTED",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
  "ARCHIVED",
] as const;

const priorities = [
  "LOW",
  "NORMAL",
  "HIGH",
  "URGENT",
] as const;

const itemTypes = [
  "MATERIAL",
  "SERVICE",
  "WORK",
] as const;

const identifierSchema = z
  .string()
  .trim()
  .min(1, "المعرّف مطلوب.");

const nullableTextSchema = z
  .string()
  .trim()
  .transform((value) => value || null)
  .nullable()
  .optional();

const optionalDateSchema = z
  .union([z.string().trim(), z.date(), z.null()])
  .optional()
  .transform((value, context) => {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return value === undefined ? undefined : null;
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

    return date.toISOString();
  });

const optionalFilterDateSchema =
  optionalDateSchema.transform(
    (value) => value ?? undefined,
  );

const positiveDecimalSchema = z
  .union([z.string().trim(), z.number()])
  .transform((value, context) => {
    const normalized = Number(value);

    if (
      !Number.isFinite(normalized) ||
      normalized <= 0
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "يجب أن تكون القيمة رقماً أكبر من صفر.",
      });

      return z.NEVER;
    }

    return String(value).trim();
  });

const optionalNonnegativeDecimalSchema = z
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
      return value === undefined ? undefined : null;
    }

    const normalized = Number(value);

    if (
      !Number.isFinite(normalized) ||
      normalized < 0
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "يجب أن تكون القيمة رقماً موجباً أو صفراً.",
      });

      return z.NEVER;
    }

    return String(value).trim();
  });

const contextSchema = z.object({
  workspaceId: identifierSchema,
  actorUserId: identifierSchema,
});

export const procurementItemSchema = z.object({
  id: identifierSchema.optional(),
  lineNumber: z.coerce
    .number()
    .int()
    .min(1, "رقم البند يجب أن يبدأ من واحد."),
  type: z.enum(itemTypes),
  description: z
    .string()
    .trim()
    .min(2, "وصف البند قصير جداً.")
    .max(500, "وصف البند طويل جداً."),
  quantity: positiveDecimalSchema,
  unit: z
    .string()
    .trim()
    .min(1, "وحدة القياس مطلوبة.")
    .max(50, "وحدة القياس طويلة جداً."),
  specification: nullableTextSchema,
  estimatedUnitPrice:
    optionalNonnegativeDecimalSchema,
  estimatedTotal:
    optionalNonnegativeDecimalSchema,
  requiredByDate: optionalDateSchema,
  deliveryLocation: nullableTextSchema,
  notes: nullableTextSchema,
});

const requestFields = {
  projectId: identifierSchema.nullable().optional(),
  number: z
    .string()
    .trim()
    .min(2, "رقم الطلب قصير جداً.")
    .max(100, "رقم الطلب طويل جداً.")
    .transform((value) => value.toUpperCase()),
  title: z
    .string()
    .trim()
    .min(3, "عنوان الطلب قصير جداً.")
    .max(250, "عنوان الطلب طويل جداً."),
  description: nullableTextSchema,
  priority: z.enum(priorities).default("NORMAL"),
  category: nullableTextSchema,
  requiredByDate: optionalDateSchema,
  currency: z
    .string()
    .trim()
    .length(3, "رمز العملة يجب أن يتكون من ثلاثة أحرف.")
    .transform((value) => value.toUpperCase())
    .default("SAR"),
  requestedById: identifierSchema,
  assignedToId: identifierSchema.nullable().optional(),
  items: z
    .array(procurementItemSchema)
    .max(200, "الحد الأقصى 200 بند.")
    .optional(),
};

function validateUniqueLineNumbers(
  value: { items?: Array<{ lineNumber: number }> },
  context: z.RefinementCtx,
): void {
  if (!value.items) {
    return;
  }

  const lineNumbers = value.items.map(
    (item) => item.lineNumber,
  );

  if (
    new Set(lineNumbers).size !== lineNumbers.length
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["items"],
      message: "أرقام البنود يجب ألا تتكرر.",
    });
  }
}

export const createProcurementRequestSchema =
  contextSchema
    .extend(requestFields)
    .superRefine(validateUniqueLineNumbers);

export const updateProcurementRequestSchema =
  contextSchema
    .extend({
      procurementRequestId: identifierSchema,
      projectId:
        requestFields.projectId,
      title: requestFields.title.optional(),
      description:
        requestFields.description,
      priority:
        requestFields.priority.optional(),
      category: requestFields.category,
      requiredByDate:
        requestFields.requiredByDate,
      currency:
        requestFields.currency.optional(),
      requestedById:
        requestFields.requestedById.optional(),
      assignedToId:
        requestFields.assignedToId,
      items: requestFields.items,
    })
    .superRefine(validateUniqueLineNumbers);

export const procurementRequestCommandSchema =
  contextSchema.extend({
    procurementRequestId: identifierSchema,
    reason: nullableTextSchema,
  });

export const procurementRequestReasonCommandSchema =
  procurementRequestCommandSchema.superRefine(
    (value, context) => {
      if (!value.reason) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["reason"],
          message: "سبب الإجراء مطلوب.",
        });
      }
    },
  );

export const getProcurementRequestSchema =
  contextSchema.extend({
    procurementRequestId: identifierSchema,
  });

export const listProcurementRequestsSchema =
  contextSchema
    .extend({
      status: z.enum(statuses).optional(),
      priority: z.enum(priorities).optional(),
      projectId: identifierSchema.nullable().optional(),
      requestedById: identifierSchema.optional(),
      assignedToId:
        identifierSchema.nullable().optional(),
      category: z
        .string()
        .trim()
        .max(100, "التصنيف طويل جداً.")
        .optional()
        .transform((value) => value || undefined),
      search: z
        .string()
        .trim()
        .max(200, "نص البحث طويل جداً.")
        .optional()
        .transform((value) => value || undefined),
      requiredByFrom: optionalFilterDateSchema,
      requiredByTo: optionalFilterDateSchema,
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
    })
    .superRefine((value, context) => {
      if (
        value.requiredByFrom &&
        value.requiredByTo &&
        value.requiredByTo < value.requiredByFrom
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["requiredByTo"],
          message:
            "نهاية نطاق التاريخ يجب ألا تسبق بدايته.",
        });
      }
    });
