"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Input, Select } from "@oqood/design-system";

import {
  createPartnerAction,
  type PartnerRoleValue,
} from "../actions";

type FormState = {
  status: "idle" | "error" | "success";
  message?: string;
  partnerId?: string;
};

const initialState: FormState = { status: "idle" };

const roleOptions: Array<{
  value: PartnerRoleValue;
  label: string;
}> = [
  { value: "SUPPLIER", label: "مورد" },
  { value: "CONTRACTOR", label: "مقاول" },
  { value: "CONSULTANT", label: "استشاري" },
  { value: "MANUFACTURER", label: "مصنع" },
  { value: "DISTRIBUTOR", label: "موزع" },
  { value: "SERVICE_PROVIDER", label: "مقدم خدمات" },
  {
    value: "LOGISTICS_PROVIDER",
    label: "مقدم خدمات لوجستية",
  },
  { value: "INVESTMENT_PARTNER", label: "شريك استثماري" },
];

function value(formData: FormData, key: string) {
  const result = formData.get(key);
  return typeof result === "string" ? result.trim() : "";
}

async function submitPartner(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const result = await createPartnerAction({
    nameAr: value(formData, "nameAr"),
    nameEn: value(formData, "nameEn"),
    commercialRegister: value(
      formData,
      "commercialRegister",
    ),
    taxNumber: value(formData, "taxNumber"),
    email: value(formData, "email"),
    phone: value(formData, "phone"),
    website: value(formData, "website"),
    city: value(formData, "city"),
    roles: [value(formData, "role") as PartnerRoleValue],
  });

  return result.success
    ? {
        status: "success",
        message: result.message,
        partnerId: result.data.partnerId,
      }
    : { status: "error", message: result.message };
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      className="oppPrimaryButton"
      disabled={pending}
      type="submit"
    >
      {pending ? "جارٍ الحفظ..." : "حفظ شريك الأعمال"}
    </button>
  );
}

export function PartnerCreateForm() {
  const router = useRouter();
  const [state, formAction] = useActionState(
    submitPartner,
    initialState,
  );

  useEffect(() => {
    if (state.status === "success") {
      router.push("/platform/partners");
      router.refresh();
    }
  }, [router, state.status]);

  return (
    <form
      action={formAction}
      className="opportunitySetupPanel"
    >
      <section className="opportunitySection">
        <div className="opportunitySection__head">
          <div>
            <span>البيانات الأساسية</span>
            <h2>تعريف شريك الأعمال</h2>
            <p>
              أدخل بيانات المورد أو المقاول ليصبح متاحًا
              للدعوة في الفرص.
            </p>
          </div>
        </div>

        {state.status === "error" ? (
          <div className="opportunityFormAlert opportunityFormAlert--error">
            {state.message}
          </div>
        ) : null}

        <div className="opportunityFormGrid">
          <label>
            <span>الاسم بالعربية *</span>
            <Input
              name="nameAr"
              placeholder="مثال: شركة التوريد المتقدمة"
              required
            />
          </label>
          <label>
            <span>الاسم بالإنجليزية</span>
            <Input name="nameEn" />
          </label>
          <label>
            <span>التصنيف *</span>
            <Select name="role" required>
              {roleOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </Select>
          </label>
          <label>
            <span>المدينة</span>
            <Input name="city" placeholder="الرياض" />
          </label>
          <label>
            <span>السجل التجاري</span>
            <Input name="commercialRegister" />
          </label>
          <label>
            <span>الرقم الضريبي</span>
            <Input name="taxNumber" />
          </label>
          <label>
            <span>البريد الإلكتروني</span>
            <Input name="email" type="email" />
          </label>
          <label>
            <span>رقم الهاتف</span>
            <Input name="phone" type="tel" />
          </label>
          <label>
            <span>الموقع الإلكتروني</span>
            <Input
              name="website"
              placeholder="https://example.com"
              type="url"
            />
          </label>
        </div>
      </section>

      <div className="opportunityFormActions">
        <Link
          className="oppSecondaryButton"
          href="/platform/partners"
        >
          إلغاء
        </Link>
        <SubmitButton />
      </div>
    </form>
  );
}

