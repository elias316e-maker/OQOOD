"use client";

import styles from "./opportunity-edit-form.module.css";

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
  WorkspaceHeader,
  Alert,
  FormGuidance,
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
      className={styles.formFieldError}
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
      className={styles.primaryButton}
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
      router.replace(
        `/platform/opportunities/${state.opportunityId}`,
      );
    }
  }, [
    router,
    state.opportunityId,
    state.status,
  ]);

  return (
    <main className={styles.page}>
      <form action={formAction} className={styles.container}>
        <input
          type="hidden"
          name="opportunityId"
          value={opportunity.id}
        />

        <WorkspaceHeader
          className={styles.header}
          eyebrow="تعديل المنافسة"
          title={opportunity.title}
          badge={opportunity.number}
          description="حدّث بيانات المنافسة ومتطلبات المشاركة وإعدادات التقديم قبل حفظ التغييرات."
          actions={
            <>
              <Link
                className={styles.cancelButton}
                href={
                  `/platform/opportunities/` +
                  opportunity.id
                }
              >
                إلغاء
              </Link>

              <SubmitButton />
            </>
          }
        />

        <section className={styles.panel}>
          <FormGuidance
          icon="✎"
          title="تعديل بيانات المنافسة"
          description="راجع المواعيد ونطاق النشر قبل الحفظ؛ التغييرات لا تُنشر تلقائيًا للموردين."
        />
          {state.status === "error" && (
          <Alert
            tone="danger"
            aria-live="assertive"
          >
            {state.message}
          </Alert>
        )}

          {state.status === "success" && (
          <Alert
            tone="success"
            aria-live="polite"
          >
            {state.message}
          </Alert>
        )}

          <div className={styles.formGrid}>
            <div className={`${styles.sectionTitle} ${styles.fullWidth}`}>
              <span>01</span><div><strong>تعريف المنافسة</strong><small>البيانات التي تظهر في القائمة وبطاقة التفاصيل</small></div>
            </div>
            <div className={`${styles.formField} ${styles.fullWidth}`}>
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

            <div className={styles.formField}>
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

            <div className={`${styles.sectionTitle} ${styles.fullWidth}`}>
              <span>02</span><div><strong>القيمة والمواعيد</strong><small>الميزانية وفترة استقبال العروض</small></div>
            </div>

            <div className={styles.formField}>
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

            <div className={styles.formField}>
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

            <div className={styles.formField}>
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

            <div className={styles.formField}>
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

            <div className={styles.formField}>
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

            <div className={styles.formField}>
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

            <div className={`${styles.sectionTitle} ${styles.fullWidth}`}>
              <span>03</span>
              <div>
                <strong>الوصف والمتطلبات</strong>
                <small>
                  صف الاحتياج الفني ونطاق العمل والمتطلبات الرئيسية.
                </small>
              </div>
            </div>

            <div className={`${styles.formField} ${styles.fullWidth}`}>
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

            <div className={`${styles.sectionTitle} ${styles.fullWidth}`}>
              <span>04</span>
              <div>
                <strong>نطاق النشر</strong>
                <small>
                  تحكم في الجهات التي يمكنها الوصول إلى المنافسة.
                </small>
              </div>
            </div>

            <div className={`${styles.formField} ${styles.fullWidth}`}>
              <fieldset>
                <legend>نطاق النشر</legend>

                <div className={styles.choiceGrid}>
                  <label className={styles.choiceCard}>
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

                  <label className={styles.choiceCard}>
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

                  <label className={styles.choiceCard}>
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

          <div className={styles.footerBar}>
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
