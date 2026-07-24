"use client";

import {
  useActionState,
  useEffect,
} from "react";

import {
  useFormStatus,
} from "react-dom";

import Link from "next/link";
import {
  useRouter,
} from "next/navigation";

import {
  Input,
  Select,
  Textarea,
} from "@oqood/design-system";

import {
  updateOpportunityAction,
} from "../actions/update-opportunity";

import type {
  OpportunityActionFieldErrors,
} from "../actions/action-result";

import type {
  OpportunityResponse,
} from "../dtos";

type OpportunityEditFormProps = {
  opportunity: OpportunityResponse;
};

type EditOpportunityFormState = {
  status: "idle" | "error" | "success";
  message?: string;
  opportunityId?: string;
  fieldErrors?: OpportunityActionFieldErrors;
};

const initialState: EditOpportunityFormState = {
  status: "idle",
};

function readRequiredValue(
  formData: FormData,
  field: string,
): string {
  const value = formData.get(field);

  return typeof value === "string"
    ? value.trim()
    : "";
}

function readOptionalValue(
  formData: FormData,
  field: string,
): string | undefined {
  const value = readRequiredValue(
    formData,
    field,
  );

  return value || undefined;
}

function toDateInputValue(
  value: string | null,
): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

async function updateOpportunityFormAction(
  _previousState: EditOpportunityFormState,
  formData: FormData,
): Promise<EditOpportunityFormState> {
  const opportunityId =
    readRequiredValue(
      formData,
      "opportunityId",
    );

  const budget =
    readOptionalValue(
      formData,
      "budget",
    );

  const result =
    await updateOpportunityAction({
      opportunityId,
      title: readRequiredValue(
        formData,
        "title",
      ),

      type: readRequiredValue(
        formData,
        "type",
      ) as
        | "RFQ"
        | "RFP"
        | "TENDER"
        | "DIRECT_PURCHASE"
        | "SERVICE_REQUEST"
        | "SUBCONTRACT",

      visibility: readRequiredValue(
        formData,
        "visibility",
      ) as
        | "PRIVATE"
        | "INVITED"
        | "PUBLIC",

      category:
        readOptionalValue(
          formData,
          "category",
        ) ?? null,

      priority: readRequiredValue(
        formData,
        "priority",
      ),

      budget: budget ?? null,

      currency: readRequiredValue(
        formData,
        "currency",
      ),

      issueDate:
        readOptionalValue(
          formData,
          "issueDate",
        ) ?? null,

      closingDate:
        readOptionalValue(
          formData,
          "closingDate",
        ) ?? null,

      description:
        readOptionalValue(
          formData,
          "description",
        ) ?? null,
    });

  if (!result.success) {
    return {
      status: "error",
      message: result.message,
      fieldErrors: result.fieldErrors,
    };
  }

  return {
    status: "success",
    message:
      result.message ??
      "تم تحديث الفرصة بنجاح.",
    opportunityId: result.data.id,
  };
}

function FieldError({
  message,
}: {
  message?: string;
}) {
  if (!message) {
    return null;
  }

  return (
    <small
      className="formFieldError"
      role="alert"
    >
      {message}
    </small>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="primaryButton compactButton"
      type="submit"
      disabled={pending}
      aria-disabled={pending}
    >
      {pending
        ? "جارٍ حفظ التعديلات..."
        : "حفظ التعديلات"}
    </button>
  );
}

export function OpportunityEditForm({
  opportunity,
}: OpportunityEditFormProps) {
  const router = useRouter();

  const [state, formAction] =
    useActionState(
      updateOpportunityFormAction,
      initialState,
    );

  useEffect(() => {
    if (
      state.status === "success" &&
      state.opportunityId
    ) {
      router.push(
        `/platform/opportunities/${state.opportunityId}`,
      );

      router.refresh();
    }
  }, [
    router,
    state.opportunityId,
    state.status,
  ]);

  return (
    <main className="platformContent">
      <form action={formAction}>
        <input
          type="hidden"
          name="opportunityId"
          value={opportunity.id}
        />

        <section className="listPageHeader">
          <div>
            <span className="pageEyebrow">
              تعديل الفرصة
            </span>

            <h1>{opportunity.title}</h1>

            <p>
              رقم الفرصة:{" "}
              {opportunity.number}
            </p>
          </div>

          <div className="commandHeaderActions">
            <Link
              className="secondaryButton compactButton"
              href={
                `/platform/opportunities/` +
                opportunity.id
              }
            >
              إلغاء
            </Link>

            <SubmitButton />
          </div>
        </section>

        <section className="dashboardPanel">
          {state.status === "error" && (
            <div
              className="formAlert formAlertError"
              role="alert"
              aria-live="assertive"
            >
              {state.message}
            </div>
          )}

          {state.status === "success" && (
            <div
              className="formAlert formAlertSuccess"
              role="status"
              aria-live="polite"
            >
              {state.message}
            </div>
          )}

          <div className="opportunityForm">
            <div className="formField fullWidth">
              <label htmlFor="title">
                عنوان الفرصة
              </label>

              <Input
                id="title"
                name="title"
                required
                defaultValue={
                  opportunity.title
                }
                aria-invalid={
                  Boolean(
                    state.fieldErrors?.title,
                  )
                }
              />

              <FieldError
                message={
                  state.fieldErrors?.title
                }
              />
            </div>

            <div className="formField">
              <label htmlFor="type">
                نوع الفرصة
              </label>

              <Select
                id="type"
                name="type"
                defaultValue={
                  opportunity.type
                }
              >
                <option value="RFQ">
                  طلب عرض سعر RFQ
                </option>
                <option value="RFP">
                  طلب تقديم عرض RFP
                </option>
                <option value="TENDER">
                  منافسة
                </option>
                <option value="DIRECT_PURCHASE">
                  شراء مباشر
                </option>
                <option value="SERVICE_REQUEST">
                  طلب خدمة
                </option>
                <option value="SUBCONTRACT">
                  مقاولة من الباطن
                </option>
              </Select>

              <FieldError
                message={
                  state.fieldErrors?.type
                }
              />
            </div>

            <div className="formField">
              <label htmlFor="category">
                التصنيف
              </label>

              <Input
                id="category"
                name="category"
                defaultValue={
                  opportunity.category ?? ""
                }
              />

              <FieldError
                message={
                  state.fieldErrors?.category
                }
              />
            </div>

            <div className="formField">
              <label htmlFor="priority">
                الأولوية
              </label>

              <Select
                id="priority"
                name="priority"
                defaultValue={
                  opportunity.priority
                }
              >
                <option value="NORMAL">
                  عادية
                </option>
                <option value="URGENT">
                  عاجلة
                </option>
                <option value="CRITICAL">
                  حرجة
                </option>
              </Select>

              <FieldError
                message={
                  state.fieldErrors?.priority
                }
              />
            </div>

            <div className="formField">
              <label htmlFor="currency">
                العملة
              </label>

              <Select
                id="currency"
                name="currency"
                defaultValue={
                  opportunity.currency
                }
              >
                <option value="SAR">
                  ريال سعودي
                </option>
                <option value="USD">
                  دولار أمريكي
                </option>
                <option value="AED">
                  درهم إماراتي
                </option>
              </Select>

              <FieldError
                message={
                  state.fieldErrors?.currency
                }
              />
            </div>

            <div className="formField">
              <label htmlFor="budget">
                الميزانية التقديرية
              </label>

              <Input
                id="budget"
                name="budget"
                type="number"
                min="0"
                step="0.01"
                defaultValue={
                  opportunity.budget ?? ""
                }
              />

              <FieldError
                message={
                  state.fieldErrors?.budget
                }
              />
            </div>

            <div className="formField">
              <label htmlFor="issueDate">
                تاريخ الإصدار
              </label>

              <Input
                id="issueDate"
                name="issueDate"
                type="date"
                defaultValue={
                  toDateInputValue(
                    opportunity.issueDate,
                  )
                }
              />

              <FieldError
                message={
                  state.fieldErrors
                    ?.issueDate
                }
              />
            </div>

            <div className="formField">
              <label htmlFor="closingDate">
                تاريخ الإغلاق
              </label>

              <Input
                id="closingDate"
                name="closingDate"
                type="date"
                defaultValue={
                  toDateInputValue(
                    opportunity.closingDate,
                  )
                }
              />

              <FieldError
                message={
                  state.fieldErrors
                    ?.closingDate
                }
              />
            </div>

            <div className="formField fullWidth">
              <label htmlFor="description">
                وصف الاحتياج
              </label>

              <Textarea
                id="description"
                name="description"
                rows={6}
                defaultValue={
                  opportunity.description ?? ""
                }
              />

              <FieldError
                message={
                  state.fieldErrors
                    ?.description
                }
              />
            </div>

            <div className="formField fullWidth">
              <fieldset>
                <legend>نطاق النشر</legend>

                <div className="choiceGrid">
                  <label className="choiceCard">
                    <input
                      name="visibility"
                      type="radio"
                      value="INVITED"
                      defaultChecked={
                        opportunity.visibility ===
                        "INVITED"
                      }
                    />

                    <span>
                      <strong>
                        منافسة محدودة
                      </strong>
                      <small>
                        الدعوة لشركات محددة.
                      </small>
                    </span>
                  </label>

                  <label className="choiceCard">
                    <input
                      name="visibility"
                      type="radio"
                      value="PUBLIC"
                      defaultChecked={
                        opportunity.visibility ===
                        "PUBLIC"
                      }
                    />

                    <span>
                      <strong>
                        منافسة عامة
                      </strong>
                      <small>
                        متاحة للشركات المؤهلة.
                      </small>
                    </span>
                  </label>

                  <label className="choiceCard">
                    <input
                      name="visibility"
                      type="radio"
                      value="PRIVATE"
                      defaultChecked={
                        opportunity.visibility ===
                        "PRIVATE"
                      }
                    />

                    <span>
                      <strong>
                        فرصة خاصة
                      </strong>
                      <small>
                        للمستخدمين المخولين فقط.
                      </small>
                    </span>
                  </label>
                </div>
              </fieldset>

              <FieldError
                message={
                  state.fieldErrors
                    ?.visibility
                }
              />
            </div>
          </div>

          <div className="wizardFooter">
            <span>
              الحالة الحالية:{" "}
              {opportunity.status}
            </span>

            <SubmitButton />
          </div>
        </section>
      </form>
    </main>
  );
}
