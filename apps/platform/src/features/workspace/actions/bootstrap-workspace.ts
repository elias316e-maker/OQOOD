"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  TrialPlanNotAvailableError,
  WorkspaceBillingAlreadyInitializedError,
} from "@/features/billing";
import { auth } from "@/lib/auth";
import {
  DefaultWorkspaceBootstrapService,
  WorkspaceAlreadyExistsError,
} from "../services";

import type {
  BootstrapWorkspaceActionState,
} from "./bootstrap-workspace-action.types";

type ValidationError = Error & {
  name: "WorkspaceBootstrapValidationError";
  validationErrors?: Record<string, string>;
};

function isValidationError(
  error: unknown,
): error is ValidationError {
  return (
    error instanceof Error &&
    error.name === "WorkspaceBootstrapValidationError"
  );
}

function readRequiredFormValue(
  formData: FormData,
  field: string,
): string {
  const value = formData.get(field);

  return typeof value === "string" ? value : "";
}

function readOptionalFormValue(
  formData: FormData,
  field: string,
): string | undefined {
  const value = formData.get(field);

  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();

  return normalized || undefined;
}

export async function bootstrapWorkspaceAction(
  _previousState: BootstrapWorkspaceActionState,
  formData: FormData,
): Promise<BootstrapWorkspaceActionState> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return {
      status: "error",
      message:
        "انتهت جلسة تسجيل الدخول. سجّل الدخول مجددًا للمتابعة.",
    };
  }

  const service = new DefaultWorkspaceBootstrapService();

  let workspaceSlug: string;

  try {
    const result = await service.execute(session.user.id, {
      workspaceNameAr: readRequiredFormValue(
        formData,
        "workspaceNameAr",
      ),
      workspaceNameEn: readOptionalFormValue(
        formData,
        "workspaceNameEn",
      ),
      companyNameAr: readRequiredFormValue(
        formData,
        "companyNameAr",
      ),
      companyNameEn: readOptionalFormValue(
        formData,
        "companyNameEn",
      ),
      commercialRegister: readOptionalFormValue(
        formData,
        "commercialRegister",
      ),
      countryCode: readRequiredFormValue(
        formData,
        "countryCode",
      ),
      timezone: readRequiredFormValue(
        formData,
        "timezone",
      ),
      defaultLanguage: readRequiredFormValue(
        formData,
        "defaultLanguage",
      ),
      defaultCurrency: readRequiredFormValue(
        formData,
        "defaultCurrency",
      ),
    });

    workspaceSlug = result.workspace.slug;
  } catch (error) {
    if (isValidationError(error)) {
      return {
        status: "error",
        message: error.message,
        fieldErrors: error.validationErrors,
      };
    }

    if (error instanceof WorkspaceAlreadyExistsError) {
      return {
        status: "error",
        message:
          "تم إعداد مساحة عمل لهذا الحساب مسبقًا.",
      };
    }

    if (error instanceof TrialPlanNotAvailableError) {
      console.error(
        "Workspace bootstrap failed: trial plan unavailable.",
        error,
      );

      return {
        status: "error",
        message:
          "تعذر تفعيل التجربة المجانية حاليًا. حاول مرة أخرى لاحقًا.",
      };
    }

    if (
      error instanceof
      WorkspaceBillingAlreadyInitializedError
    ) {
      console.error(
        "Workspace bootstrap failed: incompatible billing state.",
        error,
      );

      return {
        status: "error",
        message:
          "توجد حالة اشتراك غير متوافقة لمساحة العمل.",
      };
    }

    console.error(
      "Unexpected workspace bootstrap failure.",
      error,
    );

    return {
      status: "error",
      message:
        "حدث خطأ غير متوقع أثناء إنشاء مساحة العمل. لم تُحفظ أي بيانات جزئية.",
    };
  }

  revalidatePath("/platform");
  revalidatePath("/platform/onboarding");

  console.info("Workspace bootstrap completed.", {
    workspaceSlug,
    userId: session.user.id,
  });

  redirect("/platform");
}
