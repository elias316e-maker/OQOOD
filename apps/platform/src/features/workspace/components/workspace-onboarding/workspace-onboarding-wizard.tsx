"use client";

import {
  useActionState,
  useState,
} from "react";
import { useFormStatus } from "react-dom";

import {
  Button,
  Input,
  OqoodLogo,
  Select,
} from "@oqood/design-system";

import {
  bootstrapWorkspaceAction,
  INITIAL_BOOTSTRAP_WORKSPACE_ACTION_STATE,
} from "../../actions";

type WorkspaceOnboardingWizardProps = {
  userName: string;
};

const STEPS = [
  {
    title: "مساحة العمل",
    description: "تحديد هوية مساحة العمل.",
  },
  {
    title: "بيانات الشركة",
    description: "إضافة معلومات المنشأة.",
  },
  {
    title: "الإعدادات",
    description: "اللغة والعملـة والمنطقة الزمنية.",
  },
  {
    title: "المراجعة",
    description: "مراجعة البيانات وبدء التجربة.",
  },
] as const;

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      disabled={pending}
      size="lg"
      type="submit"
    >
      {pending
        ? "جارٍ إنشاء مساحة العمل..."
        : "إنشاء مساحة العمل"}
    </Button>
  );
}

function FieldError({
  error,
  id,
}: {
  error?: string;
  id: string;
}) {
  if (!error) {
    return null;
  }

  return (
    <p
      className="workspaceOnboardingFieldError"
      id={id}
      role="alert"
    >
      {error}
    </p>
  );
}

export function WorkspaceOnboardingWizard({
  userName,
}: WorkspaceOnboardingWizardProps) {
  const [step, setStep] = useState(0);

  const [state, formAction] = useActionState(
    bootstrapWorkspaceAction,
    INITIAL_BOOTSTRAP_WORKSPACE_ACTION_STATE,
  );

  function goToNextStep() {
    setStep((current) =>
      Math.min(current + 1, STEPS.length - 1),
    );
  }

  function goToPreviousStep() {
    setStep((current) => Math.max(current - 1, 0));
  }

  return (
    <main className="workspaceOnboardingPage">
      <section className="workspaceOnboardingVisual">
        <div className="workspaceOnboardingBrand">
          <OqoodLogo inverted />
        </div>

        <div className="workspaceOnboardingVisualContent">
          <span className="workspaceOnboardingEyebrow">
            OQOOD First Run Experience
          </span>

          <h1>
            مرحبًا {userName}، لنُجهّز مساحة عمل شركتك.
          </h1>

          <p>
            سننشئ مساحة العمل والشركة وحساب المالك ونفعّل
            التجربة الاحترافية لمدة 30 يومًا في عملية واحدة
            آمنة.
          </p>

          <div className="workspaceOnboardingBenefits">
            <div>
              <strong>30 يومًا</strong>
              <span>Professional Trial</span>
            </div>

            <div>
              <strong>عملية واحدة</strong>
              <span>إنشاء ذري وآمن</span>
            </div>

            <div>
              <strong>أقل من دقيقة</strong>
              <span>إعداد كامل للمنصة</span>
            </div>
          </div>
        </div>
      </section>

      <section className="workspaceOnboardingWorkspace">
        <header className="workspaceOnboardingHeader">
          <div>
            <span>
              الخطوة {step + 1} من {STEPS.length}
            </span>

            <h2>{STEPS[step].title}</h2>

            <p>{STEPS[step].description}</p>
          </div>

          <div
            aria-label="تقدم إعداد مساحة العمل"
            className="workspaceOnboardingProgress"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={STEPS.length}
            aria-valuenow={step + 1}
          >
            <span
              style={{
                width: `${((step + 1) / STEPS.length) * 100}%`,
              }}
            />
          </div>
        </header>

        <nav
          aria-label="خطوات إعداد مساحة العمل"
          className="workspaceOnboardingSteps"
        >
          {STEPS.map((item, index) => (
            <button
              aria-current={index === step ? "step" : undefined}
              className={
                index === step
                  ? "workspaceOnboardingStep isActive"
                  : index < step
                    ? "workspaceOnboardingStep isComplete"
                    : "workspaceOnboardingStep"
              }
              key={item.title}
              onClick={() => {
                if (index <= step) {
                  setStep(index);
                }
              }}
              type="button"
            >
              <span>{index + 1}</span>

              <div>
                <strong>{item.title}</strong>
                <small>{item.description}</small>
              </div>
            </button>
          ))}
        </nav>

        <form
          action={formAction}
          className="workspaceOnboardingForm"
        >
          <section
            aria-labelledby="workspace-step-title"
            hidden={step !== 0}
          >
            <div className="workspaceOnboardingSectionTitle">
              <h3 id="workspace-step-title">
                معلومات مساحة العمل
              </h3>

              <p>
                يظهر الاسم العربي في الواجهة الرئيسية ويمكن
                إضافة اسم إنجليزي للاستخدام الدولي.
              </p>
            </div>

            <div className="workspaceOnboardingFieldGrid">
              <label>
                <span>اسم مساحة العمل بالعربية</span>

                <Input
                  aria-describedby={
                    state.fieldErrors?.workspaceNameAr
                      ? "workspaceNameAr-error"
                      : undefined
                  }
                  aria-invalid={
                    Boolean(
                      state.fieldErrors?.workspaceNameAr,
                    )
                  }
                  name="workspaceNameAr"
                  placeholder="مثال: مساحة شركة البناء المتقدمة"
                  required
                />

                <FieldError
                  error={state.fieldErrors?.workspaceNameAr}
                  id="workspaceNameAr-error"
                />
              </label>

              <label>
                <span>اسم مساحة العمل بالإنجليزية</span>

                <Input
                  aria-describedby={
                    state.fieldErrors?.workspaceNameEn
                      ? "workspaceNameEn-error"
                      : undefined
                  }
                  aria-invalid={
                    Boolean(
                      state.fieldErrors?.workspaceNameEn,
                    )
                  }
                  dir="ltr"
                  name="workspaceNameEn"
                  placeholder="Advanced Construction Workspace"
                />

                <FieldError
                  error={state.fieldErrors?.workspaceNameEn}
                  id="workspaceNameEn-error"
                />
              </label>
            </div>
          </section>

          <section
            aria-labelledby="company-step-title"
            hidden={step !== 1}
          >
            <div className="workspaceOnboardingSectionTitle">
              <h3 id="company-step-title">
                معلومات الشركة
              </h3>

              <p>
                ستصبح هذه الشركة الكيان الأساسي المرتبط
                بمساحة العمل.
              </p>
            </div>

            <div className="workspaceOnboardingFieldGrid">
              <label>
                <span>اسم الشركة بالعربية</span>

                <Input
                  aria-describedby={
                    state.fieldErrors?.companyNameAr
                      ? "companyNameAr-error"
                      : undefined
                  }
                  aria-invalid={
                    Boolean(
                      state.fieldErrors?.companyNameAr,
                    )
                  }
                  name="companyNameAr"
                  placeholder="مثال: شركة البناء المتقدمة"
                  required
                />

                <FieldError
                  error={state.fieldErrors?.companyNameAr}
                  id="companyNameAr-error"
                />
              </label>

              <label>
                <span>اسم الشركة بالإنجليزية</span>

                <Input
                  aria-describedby={
                    state.fieldErrors?.companyNameEn
                      ? "companyNameEn-error"
                      : undefined
                  }
                  aria-invalid={
                    Boolean(
                      state.fieldErrors?.companyNameEn,
                    )
                  }
                  dir="ltr"
                  name="companyNameEn"
                  placeholder="Advanced Construction Company"
                />

                <FieldError
                  error={state.fieldErrors?.companyNameEn}
                  id="companyNameEn-error"
                />
              </label>

              <label>
                <span>رقم السجل التجاري</span>

                <Input
                  aria-describedby={
                    state.fieldErrors?.commercialRegister
                      ? "commercialRegister-error"
                      : undefined
                  }
                  aria-invalid={
                    Boolean(
                      state.fieldErrors?.commercialRegister,
                    )
                  }
                  dir="ltr"
                  name="commercialRegister"
                  placeholder="1010123456"
                />

                <FieldError
                  error={
                    state.fieldErrors?.commercialRegister
                  }
                  id="commercialRegister-error"
                />
              </label>
            </div>
          </section>

          <section
            aria-labelledby="settings-step-title"
            hidden={step !== 2}
          >
            <div className="workspaceOnboardingSectionTitle">
              <h3 id="settings-step-title">
                الإعدادات الأساسية
              </h3>

              <p>
                يمكن تعديل هذه الإعدادات لاحقًا من إعدادات
                مساحة العمل.
              </p>
            </div>

            <div className="workspaceOnboardingFieldGrid">
              <label>
                <span>الدولة</span>

                <Select
                  defaultValue="SA"
                  name="countryCode"
                  required
                >
                  <option value="SA">
                    المملكة العربية السعودية
                  </option>
                  <option value="BH">مملكة البحرين</option>
                  <option value="AE">
                    الإمارات العربية المتحدة
                  </option>
                </Select>

                <FieldError
                  error={state.fieldErrors?.countryCode}
                  id="countryCode-error"
                />
              </label>

              <label>
                <span>المنطقة الزمنية</span>

                <Select
                  defaultValue="Asia/Riyadh"
                  name="timezone"
                  required
                >
                  <option value="Asia/Riyadh">
                    الرياض — UTC+3
                  </option>
                  <option value="Asia/Bahrain">
                    البحرين — UTC+3
                  </option>
                  <option value="Asia/Dubai">
                    دبي — UTC+4
                  </option>
                </Select>

                <FieldError
                  error={state.fieldErrors?.timezone}
                  id="timezone-error"
                />
              </label>

              <label>
                <span>اللغة الافتراضية</span>

                <Select
                  defaultValue="ar"
                  name="defaultLanguage"
                  required
                >
                  <option value="ar">العربية</option>
                  <option value="en">English</option>
                </Select>

                <FieldError
                  error={state.fieldErrors?.defaultLanguage}
                  id="defaultLanguage-error"
                />
              </label>

              <label>
                <span>العملة الافتراضية</span>

                <Select
                  defaultValue="SAR"
                  name="defaultCurrency"
                  required
                >
                  <option value="SAR">
                    الريال السعودي — SAR
                  </option>
                  <option value="BHD">
                    الدينار البحريني — BHD
                  </option>
                  <option value="AED">
                    الدرهم الإماراتي — AED
                  </option>
                </Select>

                <FieldError
                  error={state.fieldErrors?.defaultCurrency}
                  id="defaultCurrency-error"
                />
              </label>
            </div>
          </section>

          <section
            aria-labelledby="review-step-title"
            hidden={step !== 3}
          >
            <div className="workspaceOnboardingSectionTitle">
              <h3 id="review-step-title">
                جاهزون للبدء
              </h3>

              <p>
                عند المتابعة سيتم إنشاء مساحة العمل وتفعيل
                Professional Trial لمدة 30 يومًا.
              </p>
            </div>

            <div className="workspaceOnboardingReview">
              <article>
                <span>مساحة العمل</span>
                <strong>
                  سيتم إنشاؤها بالحالة النشطة
                </strong>
              </article>

              <article>
                <span>الملكية</span>
                <strong>
                  سيتم تعيينك مالكًا لمساحة العمل
                </strong>
              </article>

              <article>
                <span>الاشتراك</span>
                <strong>
                  Professional Trial — 30 يومًا
                </strong>
              </article>

              <article>
                <span>الحماية</span>
                <strong>
                  جميع العناصر داخل معاملة واحدة
                </strong>
              </article>
            </div>
          </section>

          {state.status === "error" && (
            <div
              className="workspaceOnboardingAlert isError"
              role="alert"
            >
              {state.message}
            </div>
          )}

          {state.status === "success" && (
            <div
              className="workspaceOnboardingAlert isSuccess"
              role="status"
            >
              {state.message}
            </div>
          )}

          <footer className="workspaceOnboardingFooter">
            <Button
              disabled={step === 0}
              onClick={goToPreviousStep}
              type="button"
              variant="outline"
            >
              السابق
            </Button>

            <span>
              يتم حفظ البيانات فقط عند الضغط على إنشاء مساحة
              العمل.
            </span>

            {step < STEPS.length - 1 ? (
              <Button
                onClick={goToNextStep}
                size="lg"
                type="button"
              >
                التالي
              </Button>
            ) : (
              <SubmitButton />
            )}
          </footer>
        </form>
      </section>
    </main>
  );
}
