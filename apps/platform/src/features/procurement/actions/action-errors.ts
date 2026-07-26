import type {
  ProcurementActionFieldErrors,
} from "./action-result";

export class ProcurementActionContextError
  extends Error
{
  constructor(
    message =
      "تعذر تحديد المستخدم أو مساحة العمل الحالية.",
  ) {
    super(message);
    this.name = "ProcurementActionContextError";
  }
}

export class ProcurementActionValidationError
  extends Error
{
  constructor(
    public readonly fieldErrors:
      ProcurementActionFieldErrors,
    message = "تحقق من البيانات المدخلة.",
  ) {
    super(message);
    this.name = "ProcurementActionValidationError";
  }
}

