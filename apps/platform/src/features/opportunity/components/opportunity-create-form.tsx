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
  createOpportunityAction,
} from "../actions/create-opportunity";

import type {
  OpportunityActionFieldErrors,
} from "../actions/action-result";

type CreateOpportunityFormState = {
  status: "idle" | "error" | "success";
  message?: string;
  opportunityId?: string;
  fieldErrors?: OpportunityActionFieldErrors;
};

const initialState: CreateOpportunityFormState = {
  status: "idle",
};

type OpportunityCreateFormProps = {
  draftNumber: string;
};

const steps = [
  "المعلومات الأساسية",
  "جدول الكميات",
  "الشروط والمرفقات",
  "شركاء الأعمال",
  "المراجعة والنشر",
];

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

async function createOpportunityFormAction(
  _previousState: CreateOpportunityFormState,
  formData: FormData,
): Promise<CreateOpportunityFormState> {
  const budget =
    readOptionalValue(formData, "budget");

  const result =
    await createOpportunityAction({
      number: readRequiredValue(
        formData,
        "number",
      ),
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
      ) as "PRIVATE" | "INVITED" | "PUBLIC",
      category: readOptionalValue(
        formData,
        "category",
      ),
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
      "تم إنشاء الفرصة بنجاح.",
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

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="primaryButton compactButton"
      type="submit"
      disabled={pending}
      aria-disabled={pending}
    >
      {pending
        ? "جارٍ حفظ المسودة..."
        : "حفظ كمسودة"}
    </button>
  );
}

export function OpportunityCreateForm({
  draftNumber,
}: OpportunityCreateFormProps) {
  const router = useRouter();

  const [state, formAction] =
    useActionState(
      createOpportunityFormAction,
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
        <section className="listPageHeader">
          <div>
            <span className="pageEyebrow">
              فرصة جديدة
            </span>

            <h1>إنشاء طلب عرض سعر</h1>

            <p>
              مسودة رقم {draftNumber}
            </p>
          </div>

          <div className="commandHeaderActions">
            <Link
              className="secondaryButton compactButton"
              href="/platform/opportunities"
            >
              إلغاء
            </Link>

            <SaveButton />
          </div>
        </section>

        <input
          type="hidden"
          name="number"
          value={draftNumber}
        />

        <section className="opportunityWizard">
          <aside
            className="wizardSteps"
            aria-label="مراحل إنشاء الفرصة"
          >
            {steps.map((step, index) => (
              <div
                className={
                  index === 0
                    ? "wizardStep active"
                    : "wizardStep"
                }
                key={step}
              >
                <span>{index + 1}</span>

                <div>
                  <strong>{step}</strong>

                  <small>
                    {index === 0
                      ? "الخطوة الحالية"
                      : "لم تبدأ"}
                  </small>
                </div>
              </div>
            ))}
          </aside>

          <section className="wizardContent">
            <div className="wizardSectionHeader">
              <div>
                <h2>المعلومات الأساسية</h2>

                <p>
                  أدخل البيانات الرئيسية للفرصة.
                </p>
              </div>

              <span className="draftBadge">
                مسودة
              </span>
            </div>

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
                  aria-invalid={
                    Boolean(
                      state.fieldErrors?.title,
                    )
                  }
                  placeholder="مثال: توريد أنابيب فولاذية لمشروع صناعي"
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
                  defaultValue="RFQ"
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

                <Select
                  id="category"
                  name="category"
                  defaultValue="materials"
                >
                  <option value="materials">
                    مواد ومستلزمات
                  </option>

                  <option value="services">
                    خدمات
                  </option>

                  <option value="equipment">
                    معدات
                  </option>

                  <option value="subcontract">
                    مقاولات باطن
                  </option>
                </Select>

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
                  defaultValue="NORMAL"
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
                  defaultValue="SAR"
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
                  placeholder="0.00"
                  aria-invalid={
                    Boolean(
                      state.fieldErrors?.budget,
                    )
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
                  aria-invalid={
                    Boolean(
                      state.fieldErrors
                        ?.issueDate,
                    )
                  }
                />

                <FieldError
                  message={
                    state.fieldErrors?.issueDate
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
                  aria-invalid={
                    Boolean(
                      state.fieldErrors
                        ?.closingDate,
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
                  rows={5}
                  placeholder="اكتب وصفًا واضحًا للمواد أو الخدمات المطلوبة..."
                  aria-invalid={
                    Boolean(
                      state.fieldErrors
                        ?.description,
                    )
                  }
                />

                <FieldError
                  message={
                    state.fieldErrors
                      ?.description
                  }
                />

                <small>
                  سيظهر هذا الوصف للشركات
                  المدعوة للمنافسة.
                </small>
              </div>

              <div className="formField fullWidth">
                <fieldset>
                  <legend>نطاق النشر</legend>

                  <div className="choiceGrid">
                    <label className="choiceCard">
                      <input
                        defaultChecked
                        name="visibility"
                        type="radio"
                        value="INVITED"
                      />

                      <span>
                        <strong>
                          منافسة محدودة
                        </strong>

                        <small>
                          الدعوة موجهة لشركات
                          محددة فقط.
                        </small>
                      </span>
                    </label>

                    <label className="choiceCard">
                      <input
                        name="visibility"
                        type="radio"
                        value="PUBLIC"
                      />

                      <span>
                        <strong>
                          منافسة عامة
                        </strong>

                        <small>
                          تظهر لجميع الشركات
                          المؤهلة.
                        </small>
                      </span>
                    </label>

                    <label className="choiceCard">
                      <input
                        name="visibility"
                        type="radio"
                        value="PRIVATE"
                      />

                      <span>
                        <strong>
                          طلب خاص
                        </strong>

                        <small>
                          لا تظهر إلا للمستخدمين
                          المخولين.
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
                تُحفظ الفرصة أولًا كمسودة
              </span>

              <SaveButton />
            </div>
          </section>
        </section>
      </form>
    </main>
  );
}
