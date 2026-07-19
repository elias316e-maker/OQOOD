import type { WorkspaceBootstrapInput } from "../types/workspace-bootstrap.types";

const REQUIRED_TEXT_FIELDS = [
  "workspaceNameAr",
  "companyNameAr",
  "countryCode",
  "timezone",
  "defaultLanguage",
  "defaultCurrency",
] as const;

export type WorkspaceBootstrapValidationResult =
  | {
      success: true;
      data: WorkspaceBootstrapInput;
    }
  | {
      success: false;
      errors: Record<string, string>;
    };

export function validateWorkspaceBootstrapInput(
  input: WorkspaceBootstrapInput,
): WorkspaceBootstrapValidationResult {
  const errors: Record<string, string> = {};

  for (const field of REQUIRED_TEXT_FIELDS) {
    if (!input[field]?.trim()) {
      errors[field] = "هذا الحقل مطلوب.";
    }
  }

  if (input.workspaceNameAr?.trim().length < 2) {
    errors.workspaceNameAr =
      "يجب ألا يقل اسم مساحة العمل عن حرفين.";
  }

  if (input.companyNameAr?.trim().length < 2) {
    errors.companyNameAr =
      "يجب ألا يقل اسم الشركة عن حرفين.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      errors,
    };
  }

  return {
    success: true,
    data: {
      ...input,
      workspaceNameAr: input.workspaceNameAr.trim(),
      workspaceNameEn: input.workspaceNameEn?.trim() || undefined,
      companyNameAr: input.companyNameAr.trim(),
      companyNameEn: input.companyNameEn?.trim() || undefined,
      commercialRegister:
        input.commercialRegister?.trim() || undefined,
      countryCode: input.countryCode.trim().toUpperCase(),
      timezone: input.timezone.trim(),
      defaultLanguage: input.defaultLanguage.trim(),
      defaultCurrency: input.defaultCurrency.trim().toUpperCase(),
    },
  };
}
