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
  Alert,
  FormActions,
  FormGuidance,
  FormSection,
  Input,
  Select,
} from "@oqood/design-system";

import {
  createPartnerAction,
  type PartnerRoleValue,
} from "../actions";

import styles from "./partner-create-form.module.css";

type FormState = {
  status:
    | "idle"
    | "error"
    | "success";
  message?: string;
  partnerId?: string;
};

const initialState: FormState = {
  status: "idle",
};

const roleOptions: Array<{
  value: PartnerRoleValue;
  label: string;
}> = [
  {
    value: "SUPPLIER",
    label: "مورد",
  },
  {
    value: "CONTRACTOR",
    label: "مقاول",
  },
  {
    value: "CONSULTANT",
    label: "استشاري",
  },
  {
    value: "MANUFACTURER",
    label: "مصنع",
  },
  {
    value: "DISTRIBUTOR",
    label: "موزع",
  },
  {
    value: "SERVICE_PROVIDER",
    label: "مقدم خدمات",
  },
  {
    value: "LOGISTICS_PROVIDER",
    label: "مقدم خدمات لوجستية",
  },
  {
    value: "INVESTMENT_PARTNER",
    label: "شريك استثماري",
  },
];

function value(
  formData: FormData,
  key: string,
): string {
  const result = formData.get(key);

  return typeof result === "string"
    ? result.trim()
    : "";
}

async function submitPartner(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const result =
    await createPartnerAction({
      nameAr: value(
        formData,
        "nameAr",
      ),
      nameEn: value(
        formData,
        "nameEn",
      ),
      commercialRegister: value(
        formData,
        "commercialRegister",
      ),
      taxNumber: value(
        formData,
        "taxNumber",
      ),
      email: value(
        formData,
        "email",
      ),
      phone: value(
        formData,
        "phone",
      ),
      website: value(
        formData,
        "website",
      ),
      city: value(
        formData,
        "city",
      ),
      roles: [
        value(
          formData,
          "role",
        ) as PartnerRoleValue,
      ],
    });

  return result.success
    ? {
        status: "success",
        message: result.message,
        partnerId:
          result.data.partnerId,
      }
    : {
        status: "error",
        message: result.message,
      };
}

function SubmitButton() {
  const { pending } =
    useFormStatus();

  return (
    <button
      className={styles.primaryButton}
      disabled={pending}
      type="submit"
    >
      {pending
        ? "جارٍ حفظ شريك الأعمال..."
        : "حفظ شريك الأعمال"}
    </button>
  );
}

export function PartnerCreateForm() {
  const router = useRouter();

  const [state, formAction] =
    useActionState(
      submitPartner,
      initialState,
    );

  useEffect(() => {
    if (
      state.status !== "success" ||
      !state.partnerId
    ) {
      return;
    }

    router.push(
      "/platform/partners",
    );

    router.refresh();
  }, [
    router,
    state.partnerId,
    state.status,
  ]);

  return (
    <form
      action={formAction}
      className={styles.form}
    >
      <FormGuidance
        className={styles.pageGuidance}
        icon="♧"
        title="أنشئ سجلًا موحدًا لشريك الأعمال"
        description="أدخل بيانات المنشأة النظامية ووسائل التواصل والتصنيف؛ ويمكن استكمال بيانات الأداء والتوثيق لاحقًا."
      />

      {state.status === "error" ? (
        <Alert
          className={styles.feedback}
          tone="danger"
          title="تعذر حفظ شريك الأعمال"
          aria-live="assertive"
        >
          {state.message}
        </Alert>
      ) : null}

      <div className={styles.sections}>
        <FormSection
          className={styles.section}
          eyebrow="01"
          title="هوية المنشأة"
          description="الاسم والتصنيف والموقع الأساسي لشريك الأعمال."
        >
          <div className={styles.grid}>
            <Input
              autoComplete="organization"
              hint="حقل إلزامي، من حرفين إلى 160 حرفًا."
              label="الاسم بالعربية *"
              maxLength={160}
              name="nameAr"
              placeholder="مثال: شركة التوريد المتقدمة"
              required
            />

            <Input
              autoComplete="organization"
              label="الاسم بالإنجليزية"
              maxLength={160}
              name="nameEn"
              placeholder="Advanced Supply Company"
            />

            <Select
              hint="حدد التصنيف الرئيسي للشريك."
              label="التصنيف *"
              name="role"
              required
            >
              {roleOptions.map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ),
              )}
            </Select>

            <Input
              autoComplete="address-level2"
              label="المدينة"
              name="city"
              placeholder="الرياض"
            />
          </div>
        </FormSection>

        <FormSection
          className={styles.section}
          eyebrow="02"
          title="البيانات النظامية"
          description="الأرقام الرسمية المستخدمة في التعريف والتحقق من المنشأة."
        >
          <div className={styles.grid}>
            <Input
              inputMode="numeric"
              label="السجل التجاري"
              name="commercialRegister"
              placeholder="رقم السجل التجاري"
            />

            <Input
              inputMode="numeric"
              label="الرقم الضريبي"
              name="taxNumber"
              placeholder="الرقم الضريبي"
            />
          </div>
        </FormSection>

        <FormSection
          className={styles.section}
          eyebrow="03"
          title="بيانات التواصل"
          description="القنوات المستخدمة في الدعوات والمراسلات والتنبيهات."
        >
          <div className={styles.grid}>
            <Input
              autoComplete="email"
              label="البريد الإلكتروني"
              name="email"
              placeholder="name@company.sa"
              type="email"
            />

            <Input
              autoComplete="tel"
              label="رقم الهاتف"
              name="phone"
              placeholder="+966"
              type="tel"
            />

            <div className={styles.fullWidth}>
              <Input
                autoComplete="url"
                label="الموقع الإلكتروني"
                name="website"
                placeholder="https://example.com"
                type="url"
              />
            </div>
          </div>
        </FormSection>
      </div>

      <FormActions
        className={styles.actions}
        status="بعد الحفظ سيصبح شريك الأعمال متاحًا للاستخدام في دعوات الفرص والمنافسات."
      >
        <Link
          className={styles.secondaryButton}
          href="/platform/partners"
        >
          إلغاء
        </Link>

        <SubmitButton />
      </FormActions>
    </form>
  );
}
