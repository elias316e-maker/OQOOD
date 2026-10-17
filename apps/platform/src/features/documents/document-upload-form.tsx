"use client";

import {
  useActionState,
  useState,
} from "react";

import {
  useFormStatus,
} from "react-dom";

import {
  Alert,
  FormActions,
  FormGuidance,
} from "@oqood/design-system";

import {
  uploadDocumentAction,
  type DocumentFormState,
} from "./actions";

import styles from "./document-upload-form.module.css";

type EntityOption = {
  id: string;
  label: string;
};

type EntityGroups = Record<
  string,
  EntityOption[]
>;

type DocumentUploadFormProps = {
  entities: EntityGroups;
};

const initialState: DocumentFormState = {
  status: "idle",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className={styles.submit}
      disabled={pending}
      type="submit"
    >
      {pending
        ? "جارٍ الرفع..."
        : "رفع وإرسال للمراجعة"}
    </button>
  );
}

export function DocumentUploadForm({
  entities,
}: DocumentUploadFormProps) {
  const [open, setOpen] = useState(false);

  const [entityType, setEntityType] =
    useState("WORKSPACE");

  const [state, action] =
    useActionState(
      async (
        previousState:
          DocumentFormState,
        formData: FormData,
      ) => {
        const nextState =
          await uploadDocumentAction(
            previousState,
            formData,
          );

        if (
          nextState.status ===
          "success"
        ) {
          setOpen(false);
        }

        return nextState;
      },
      initialState,
    );

  return (
    <>
      <button
        className={styles.trigger}
        onClick={() =>
          setOpen(true)
        }
        type="button"
      >
        رفع مستند جديد
      </button>

      {open ? (
        <div
          className={styles.backdrop}
          role="presentation"
        >
          <section
            aria-labelledby="document-upload-title"
            aria-modal="true"
            className={styles.modal}
            role="dialog"
          >
            <header
              className={
                styles.modalHeader
              }
            >
              <div>
                <span>
                  إضافة ملف آمن
                </span>

                <h2 id="document-upload-title">
                  رفع مستند جديد
                </h2>
              </div>

              <button
                aria-label="إغلاق نافذة رفع المستند"
                className={
                  styles.closeButton
                }
                onClick={() =>
                  setOpen(false)
                }
                type="button"
              >
                ×
              </button>
            </header>

            <form
              action={action}
              className={styles.form}
            >
              <FormGuidance
                className={
                  styles.guidance
                }
                icon="⌁"
                title="أضف المستند واربطه بالسجل الصحيح"
                description="حدد التصنيف والكيان المرتبط، ثم اختر الملف. الحد الأقصى لحجم الملف 10 م.ب."
              />

              {state.status ===
              "error" ? (
                <Alert
                  className={
                    styles.feedback
                  }
                  tone="danger"
                  title="تعذر رفع المستند"
                  role="alert"
                  aria-live="assertive"
                >
                  {state.message}
                </Alert>
              ) : null}

              <div
                className={styles.grid}
              >
                <label htmlFor="document-title">
                  <span>
                    عنوان المستند *
                  </span>

                  <input
                    id="document-title"
                    maxLength={180}
                    name="title"
                    required
                  />
                </label>

                <label htmlFor="document-category">
                  <span>
                    التصنيف *
                  </span>

                  <input
                    id="document-category"
                    list="document-categories"
                    name="category"
                    placeholder="عقد، عرض فني، شهادة..."
                    required
                  />

                  <datalist id="document-categories">
                    <option value="وثائق المنافسة" />
                    <option value="عرض فني" />
                    <option value="عرض مالي" />
                    <option value="عقد" />
                    <option value="شهادة نظامية" />
                    <option value="محضر استلام" />
                  </datalist>
                </label>

                <label htmlFor="document-entity-type">
                  <span>
                    مرتبط بـ *
                  </span>

                  <select
                    id="document-entity-type"
                    name="entityType"
                    onChange={(
                      event,
                    ) =>
                      setEntityType(
                        event.target.value,
                      )
                    }
                    value={entityType}
                  >
                    <option value="WORKSPACE">
                      مساحة العمل
                    </option>

                    <option value="PROCUREMENT_REQUEST">
                      طلب مشتريات
                    </option>

                    <option value="OPPORTUNITY">
                      منافسة
                    </option>

                    <option value="CONTRACT">
                      عقد
                    </option>

                    <option value="BUSINESS_PARTNER">
                      مورد
                    </option>

                    <option value="PROJECT">
                      مشروع
                    </option>
                  </select>
                </label>

                <label htmlFor="document-entity-id">
                  <span>
                    السجل المرتبط
                  </span>

                  <select
                    disabled={
                      entityType ===
                      "WORKSPACE"
                    }
                    id="document-entity-id"
                    name="entityId"
                    required={
                      entityType !==
                      "WORKSPACE"
                    }
                  >
                    <option value="">
                      اختر السجل
                    </option>

                    {(
                      entities[
                        entityType
                      ] ?? []
                    ).map((item) => (
                      <option
                        key={item.id}
                        value={item.id}
                      >
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label htmlFor="document-expiry">
                  <span>
                    تاريخ الانتهاء
                  </span>

                  <input
                    id="document-expiry"
                    name="expiresAt"
                    type="date"
                  />
                </label>

                <label
                  className={
                    styles.fileField
                  }
                  htmlFor="document-file"
                >
                  <span>
                    الملف * — PDF أو Word
                    أو Excel أو صورة، حتى
                    10 م.ب
                  </span>

                  <input
                    accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png"
                    id="document-file"
                    name="file"
                    required
                    type="file"
                  />
                </label>

                <label
                  className={
                    styles.notes
                  }
                  htmlFor="document-notes"
                >
                  <span>
                    ملاحظات
                  </span>

                  <textarea
                    id="document-notes"
                    maxLength={500}
                    name="notes"
                    rows={3}
                  />
                </label>

                <label
                  className={
                    styles.check
                  }
                >
                  <input
                    name="isConfidential"
                    type="checkbox"
                  />

                  <span>
                    مستند سري — وصول
                    مقيّد
                  </span>
                </label>
              </div>

              <FormActions
                className={
                  styles.actions
                }
                status="سيُرسل المستند إلى دورة المراجعة بعد الرفع."
              >
                <button
                  className={
                    styles.cancel
                  }
                  onClick={() =>
                    setOpen(false)
                  }
                  type="button"
                >
                  إلغاء
                </button>

                <SubmitButton />
              </FormActions>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
