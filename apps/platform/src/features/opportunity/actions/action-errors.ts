export class OpportunityActionContextError
  extends Error
{
  constructor(
    message =
      "تعذر تحديد المستخدم أو مساحة العمل الحالية.",
  ) {
    super(message);
    this.name = "OpportunityActionContextError";
  }
}
