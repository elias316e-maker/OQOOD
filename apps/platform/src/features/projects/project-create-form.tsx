"use client";

import {
  useActionState,
  useEffect,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  Alert,
  FormActions,
  FormGuidance,
  FormSection,
} from "@oqood/design-system";

import {
  createProjectAction,
  type ProjectFormState,
} from "./actions";

import styles from "./project-create-form.module.css";

const initialState: ProjectFormState = {
  status: "idle",
};

type ProjectCreateFormProps = {
  defaultCurrency: string;
};

export function ProjectCreateForm({
  defaultCurrency,
}: ProjectCreateFormProps) {
  const router = useRouter();

  const [state, action, pending] =
    useActionState(
      createProjectAction,
      initialState,
    );

  useEffect(() => {
    if (
      state.status === "success" &&
      state.projectId
    ) {
      router.replace(
        `/platform/projects/${state.projectId}`,
      );

      router.refresh();
    }
  }, [
    router,
    state.projectId,
    state.status,
  ]);

  return (
    <form
      action={action}
      className={styles.form}
    >
      <FormGuidance
        className={styles.guidance}
        icon="✦"
        title="أكمل بيانات المشروع الأساسية"
        description="استخدم رمزًا فريدًا وحدد الميزانية والعملة والتواريخ المستهدفة قبل إنشاء المشروع."
      />

      {state.status === "error" ? (
        <Alert
          className={styles.feedback}
          tone="danger"
          title="تعذر إنشاء المشروع"
          aria-live="assertive"
        >
          {state.message ??
            "تحقق من البيانات المدخلة ثم أعد المحاولة."}
        </Alert>
      ) : null}

      <FormSection
        className={styles.section}
        eyebrow="01"
        title="هوية المشروع"
        description="الرمز والاسم والوصف التشغيلي للمشروع."
      >
        <div className={styles.grid}>
          <label htmlFor="project-code">
            <span>رمز المشروع *</span>

            <input
              autoComplete="off"
              disabled={pending}
              id="project-code"
              maxLength={30}
              name="code"
              pattern="[A-Za-z0-9-]+"
              placeholder="PRJ-2026-001"
              required
            />
          </label>

          <label htmlFor="project-name-ar">
            <span>الاسم بالعربية *</span>

            <input
              disabled={pending}
              id="project-name-ar"
              maxLength={180}
              name="nameAr"
              required
            />
          </label>

          <label htmlFor="project-name-en">
            <span>الاسم بالإنجليزية</span>

            <input
              disabled={pending}
              id="project-name-en"
              maxLength={180}
              name="nameEn"
            />
          </label>

          <label
            className={styles.wide}
            htmlFor="project-description"
          >
            <span>الوصف</span>

            <textarea
              disabled={pending}
              id="project-description"
              maxLength={1000}
              name="description"
              placeholder="وصف مختصر لنطاق المشروع وأهدافه..."
              rows={4}
            />
          </label>
        </div>
      </FormSection>

      <FormSection
        className={styles.section}
        eyebrow="02"
        title="الخطة المالية والزمنية"
        description="الميزانية والعملة وتواريخ التنفيذ المستهدفة."
      >
        <div className={styles.grid}>
          <label htmlFor="project-budget">
            <span>الميزانية</span>

            <input
              disabled={pending}
              id="project-budget"
              min="0"
              name="budget"
              placeholder="0.00"
              step="0.01"
              type="number"
            />
          </label>

          <label htmlFor="project-currency">
            <span>العملة</span>

            <select
              defaultValue={defaultCurrency}
              disabled={pending}
              id="project-currency"
              name="currency"
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
            </select>
          </label>

          <label htmlFor="project-start-date">
            <span>تاريخ البداية</span>

            <input
              disabled={pending}
              id="project-start-date"
              name="startDate"
              type="date"
            />
          </label>

          <label htmlFor="project-end-date">
            <span>تاريخ الانتهاء</span>

            <input
              disabled={pending}
              id="project-end-date"
              name="endDate"
              type="date"
            />
          </label>
        </div>
      </FormSection>

      <FormActions
        className={styles.actions}
        status="يمكن تحديث تفاصيل المشروع وربط العمليات به بعد إنشائه."
      >
        <button
          className={styles.cancel}
          disabled={pending}
          onClick={() => router.back()}
          type="button"
        >
          إلغاء
        </button>

        <button
          className={styles.submit}
          disabled={pending}
          type="submit"
        >
          {pending
            ? "جارٍ إنشاء المشروع..."
            : "إنشاء المشروع"}
        </button>
      </FormActions>
    </form>
  );
}
