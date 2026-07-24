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
