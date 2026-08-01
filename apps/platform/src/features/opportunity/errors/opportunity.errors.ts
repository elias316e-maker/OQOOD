export class OpportunityValidationError extends Error {
  constructor(
    public readonly validationErrors: unknown,
  ) {
    super("بيانات الفرصة غير صالحة.");
    this.name = "OpportunityValidationError";
  }
}

export class OpportunityNotFoundError extends Error {
  constructor(
    public readonly opportunityId: string,
  ) {
    super("الفرصة المطلوبة غير موجودة.");
    this.name = "OpportunityNotFoundError";
  }
}

export class OpportunityNumberAlreadyExistsError
  extends Error
{
  constructor(
    public readonly number: string,
  ) {
    super("رقم الفرصة مستخدم مسبقًا داخل مساحة العمل.");
    this.name =
      "OpportunityNumberAlreadyExistsError";
  }
}

export class OpportunityUpdateFieldsRequiredError
  extends Error
{
  constructor() {
    super("يجب توفير حقل واحد على الأقل لتحديث الفرصة.");
    this.name =
      "OpportunityUpdateFieldsRequiredError";
  }
}

export class OpportunityInvalidStatusTransitionError
  extends Error
{
  constructor(
    public readonly currentStatus: string,
    public readonly targetStatus: string,
  ) {
    super(
      `لا يمكن نقل حالة الفرصة من ${currentStatus} إلى ${targetStatus}.`,
    );

    this.name =
      "OpportunityInvalidStatusTransitionError";
  }
}

export class OpportunityArchivedError extends Error {
  constructor(
    public readonly opportunityId: string,
  ) {
    super("لا يمكن تعديل فرصة مؤرشفة.");
    this.name = "OpportunityArchivedError";
  }
}

export class OpportunityPublishRequirementsError
  extends Error
{
  constructor(
    public readonly missingFields: string[],
  ) {
    super(
      "لا تستوفي الفرصة جميع متطلبات النشر.",
    );

    this.name =
      "OpportunityPublishRequirementsError";
  }
}

export class OpportunityCriterionNotFoundError extends Error {
  constructor(
    public readonly criterionId: string,
  ) {
    super("معيار التقييم المطلوب غير موجود.");
    this.name = "OpportunityCriterionNotFoundError";
  }
}

export class OpportunityCriterionDuplicateNameError extends Error {
  constructor(
    public readonly name: string,
  ) {
    super("يوجد معيار آخر بالاسم نفسه داخل المنافسة.");
    this.name = "OpportunityCriterionDuplicateNameError";
  }
}

export class OpportunityCriteriaWeightExceededError extends Error {
  constructor(
    public readonly totalWeight: string,
  ) {
    super("لا يجوز أن يتجاوز مجموع أوزان المعايير النشطة 100%.");
    this.name = "OpportunityCriteriaWeightExceededError";
  }
}

export class OpportunityCriterionImmutableError extends Error {
  constructor(
    public readonly opportunityStatus: string,
  ) {
    super("لا يمكن تعديل معايير المنافسة في حالتها الحالية.");
    this.name = "OpportunityCriterionImmutableError";
  }
}
