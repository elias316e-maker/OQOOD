"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useActionState,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useFormStatus } from "react-dom";

import {
  createProcurementRequestAction,
} from "../actions/create-procurement-request";

import type {
  ProcurementActionFieldErrors,
} from "../actions/action-result";

import styles from "./procurement-create-form.module.css";

type ItemType = "MATERIAL" | "SERVICE" | "WORK";

type EditableItem = {
  key: number;
  type: ItemType;
  description: string;
  quantity: string;
  unit: string;
  estimatedUnitPrice: string;
  requiredByDate: string;
  deliveryLocation: string;
};

type FormState = {
  status: "idle" | "error" | "success";
  message?: string;
  requestId?: string;
  fieldErrors?: ProcurementActionFieldErrors;
};

type ProcurementCreateFormProps = {
  draftNumber: string;
  defaultCurrency: string;
};

const initialState: FormState = { status: "idle" };

function newItem(key: number): EditableItem {
  return {
    key,
    type: "MATERIAL",
    description: "",
    quantity: "1",
    unit: "وحدة",
    estimatedUnitPrice: "",
    requiredByDate: "",
    deliveryLocation: "",
  };
}

function text(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

async function createRequest(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  let items: Array<{
    lineNumber: number;
    type: ItemType;
    description: string;
    quantity: string;
    unit: string;
    estimatedUnitPrice: string | null;
    requiredByDate: string | null;
    deliveryLocation: string | null;
  }>;

  try {
    items = JSON.parse(text(formData, "items")) as typeof items;
  } catch {
    return {
      status: "error",
      message: "تعذر قراءة بنود الطلب. أعد المحاولة.",
    };
  }

  const result = await createProcurementRequestAction({
    number: text(formData, "number"),
    title: text(formData, "title"),
    description: text(formData, "description") || null,
    priority: text(formData, "priority") as
      | "LOW"
      | "NORMAL"
      | "HIGH"
      | "URGENT",
    category: text(formData, "category") || null,
    requiredByDate:
      text(formData, "requiredByDate") || null,
    currency: text(formData, "currency"),
    items,
  });

  return result.success
    ? {
        status: "success",
        message: result.message,
        requestId: result.data.id,
      }
    : {
        status: "error",
        message: result.message,
        fieldErrors: result.fieldErrors,
      };
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      aria-disabled={pending}
      className={styles.primaryButton}
      disabled={pending}
      type="submit"
    >
      {pending ? "جارٍ حفظ المسودة..." : "حفظ المسودة"}
    </button>
  );
}

function FieldError({
  message,
}: {
  message?: string;
}) {
  return message ? (
    <small className={styles.fieldError} role="alert">
      {message}
    </small>
  ) : null;
}

export function ProcurementCreateForm({
  draftNumber,
  defaultCurrency,
}: ProcurementCreateFormProps) {
  const router = useRouter();
  const [nextKey, setNextKey] = useState(2);
  const [items, setItems] = useState<EditableItem[]>([
    newItem(1),
  ]);
  const [state, formAction] = useActionState(
    createRequest,
    initialState,
  );

  const total = useMemo(
    () =>
      items.reduce((sum, item) => {
        const quantity = Number(item.quantity);
        const price = Number(item.estimatedUnitPrice);
        return Number.isFinite(quantity) &&
          Number.isFinite(price)
          ? sum + quantity * price
          : sum;
      }, 0),
    [items],
  );

  const serializedItems = useMemo(
    () =>
      JSON.stringify(
        items.map((item, index) => ({
          lineNumber: index + 1,
          type: item.type,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          estimatedUnitPrice:
            item.estimatedUnitPrice || null,
          requiredByDate: item.requiredByDate || null,
          deliveryLocation:
            item.deliveryLocation || null,
        })),
      ),
    [items],
  );

  useEffect(() => {
    if (state.status === "success") {
      router.replace("/platform/procurement");
      router.refresh();
    }
  }, [router, state.status]);

  function updateItem(
    key: number,
    field: keyof Omit<EditableItem, "key">,
    value: string,
  ) {
    setItems((current) =>
      current.map((item) =>
        item.key === key
          ? { ...item, [field]: value }
          : item,
      ),
    );
  }

  function addItem() {
    setItems((current) => [
      ...current,
      newItem(nextKey),
    ]);
    setNextKey((current) => current + 1);
  }

  function removeItem(key: number) {
    setItems((current) =>
      current.length === 1
        ? current
        : current.filter((item) => item.key !== key),
    );
  }

  function formatMoney(value: number) {
    try {
      return new Intl.NumberFormat("ar-SA", {
        style: "currency",
        currency: defaultCurrency,
        maximumFractionDigits: 2,
      }).format(value);
    } catch {
      return `${value.toLocaleString("ar-SA")} ${defaultCurrency}`;
    }
  }

  return (
    <form action={formAction} className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>
            دورة الشراء الداخلية
          </span>
          <h1>إنشاء طلب مشتريات</h1>
          <p>
            مسودة رقم {draftNumber} — أضف الاحتياج والبنود
            قبل إرسالها للمراجعة.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Link
            className={styles.secondaryButton}
            href="/platform/procurement"
          >
            إلغاء
          </Link>
          <SubmitButton />
        </div>
      </header>

      <input name="number" type="hidden" value={draftNumber} />
      <input name="items" type="hidden" value={serializedItems} />

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>المعلومات الأساسية</h2>
            <p>بيانات الطلب العامة وموعد الاحتياج.</p>
          </div>
          <strong>مسودة</strong>
        </div>

        {state.status === "error" ? (
          <div
            aria-live="assertive"
            className={styles.alert}
            role="alert"
          >
            {state.message}
          </div>
        ) : null}

        <div className={styles.fields}>
          <div className={`${styles.field} ${styles.fieldWide}`}>
            <label htmlFor="procurement-title">
              عنوان الطلب *
            </label>
            <input
              aria-invalid={Boolean(state.fieldErrors?.title)}
              id="procurement-title"
              name="title"
              placeholder="مثال: توريد مواد كهربائية للمشروع"
              required
            />
            <FieldError message={state.fieldErrors?.title} />
          </div>

          <div className={styles.field}>
            <label htmlFor="procurement-category">
              التصنيف
            </label>
            <select
              defaultValue="materials"
              id="procurement-category"
              name="category"
            >
              <option value="materials">مواد ومستلزمات</option>
              <option value="services">خدمات</option>
              <option value="equipment">معدات</option>
              <option value="works">أعمال ومقاولات</option>
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="procurement-priority">
              الأولوية
            </label>
            <select
              defaultValue="NORMAL"
              id="procurement-priority"
              name="priority"
            >
              <option value="LOW">منخفضة</option>
              <option value="NORMAL">عادية</option>
              <option value="HIGH">مرتفعة</option>
              <option value="URGENT">عاجلة</option>
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="procurement-required-date">
              تاريخ الاحتياج
            </label>
            <input
              id="procurement-required-date"
              name="requiredByDate"
              type="date"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="procurement-currency">
              العملة
            </label>
            <select
              defaultValue={defaultCurrency}
              id="procurement-currency"
              name="currency"
            >
              <option value="SAR">ريال سعودي</option>
              <option value="USD">دولار أمريكي</option>
              <option value="AED">درهم إماراتي</option>
            </select>
          </div>

          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label htmlFor="procurement-description">
              وصف الاحتياج
            </label>
            <textarea
              id="procurement-description"
              name="description"
              placeholder="اشرح سبب الاحتياج والنطاق المطلوب..."
              rows={3}
            />
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>بنود الطلب</h2>
            <p>
              أضف المواد أو الخدمات مع الكميات والأسعار
              التقديرية.
            </p>
          </div>
          <div className={styles.sectionActions}>
            <button
              className={styles.secondaryButton}
              onClick={addItem}
              type="button"
            >
              ＋ إضافة بند
            </button>
          </div>
        </div>

        <div className={styles.tableViewport}>
          <table className={styles.itemTable}>
            <thead>
              <tr>
                <th>#</th>
                <th>النوع</th>
                <th>وصف البند *</th>
                <th>الكمية *</th>
                <th>الوحدة *</th>
                <th>سعر الوحدة</th>
                <th>الإجمالي</th>
                <th>تاريخ الاحتياج</th>
                <th>موقع التسليم</th>
                <th>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const itemTotal =
                  Number(item.quantity) *
                  Number(item.estimatedUnitPrice);

                return (
                  <tr key={item.key}>
                    <td className={styles.lineNumber}>
                      {index + 1}
                    </td>
                    <td>
                      <select
                        aria-label={`نوع البند ${index + 1}`}
                        value={item.type}
                        onChange={(event) =>
                          updateItem(
                            item.key,
                            "type",
                            event.target.value,
                          )
                        }
                      >
                        <option value="MATERIAL">مادة</option>
                        <option value="SERVICE">خدمة</option>
                        <option value="WORK">عمل</option>
                      </select>
                    </td>
                    <td className={styles.descriptionCell}>
                      <input
                        aria-label={`وصف البند ${index + 1}`}
                        placeholder="اسم المادة أو الخدمة"
                        required
                        value={item.description}
                        onChange={(event) =>
                          updateItem(
                            item.key,
                            "description",
                            event.target.value,
                          )
                        }
                      />
                    </td>
                    <td className={styles.numberCell}>
                      <input
                        aria-label={`كمية البند ${index + 1}`}
                        min="0.01"
                        required
                        step="0.01"
                        type="number"
                        value={item.quantity}
                        onChange={(event) =>
                          updateItem(
                            item.key,
                            "quantity",
                            event.target.value,
                          )
                        }
                      />
                    </td>
                    <td>
                      <input
                        aria-label={`وحدة البند ${index + 1}`}
                        required
                        value={item.unit}
                        onChange={(event) =>
                          updateItem(
                            item.key,
                            "unit",
                            event.target.value,
                          )
                        }
                      />
                    </td>
                    <td className={styles.numberCell}>
                      <input
                        aria-label={`سعر البند ${index + 1}`}
                        min="0"
                        placeholder="0.00"
                        step="0.01"
                        type="number"
                        value={item.estimatedUnitPrice}
                        onChange={(event) =>
                          updateItem(
                            item.key,
                            "estimatedUnitPrice",
                            event.target.value,
                          )
                        }
                      />
                    </td>
                    <td className={styles.totalCell}>
                      {Number.isFinite(itemTotal) &&
                      item.estimatedUnitPrice
                        ? formatMoney(itemTotal)
                        : "—"}
                    </td>
                    <td>
                      <input
                        aria-label={`تاريخ احتياج البند ${index + 1}`}
                        type="date"
                        value={item.requiredByDate}
                        onChange={(event) =>
                          updateItem(
                            item.key,
                            "requiredByDate",
                            event.target.value,
                          )
                        }
                      />
                    </td>
                    <td>
                      <input
                        aria-label={`موقع تسليم البند ${index + 1}`}
                        placeholder="المستودع أو المشروع"
                        value={item.deliveryLocation}
                        onChange={(event) =>
                          updateItem(
                            item.key,
                            "deliveryLocation",
                            event.target.value,
                          )
                        }
                      />
                    </td>
                    <td>
                      <button
                        aria-label={`حذف البند ${index + 1}`}
                        className={styles.dangerButton}
                        disabled={items.length === 1}
                        onClick={() => removeItem(item.key)}
                        type="button"
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className={styles.tableHint}>
          يجب أن يحتوي الطلب على بند واحد على الأقل قبل
          إرساله للمراجعة.
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>المرفقات</h2>
            <p>المواصفات الفنية والمخططات وعروض الأسعار.</p>
          </div>
        </div>
        <div className={styles.attachmentPlaceholder}>
          يمكن إضافة المرفقات بعد حفظ المسودة من صفحة تفاصيل
          الطلب، فور تفعيل مستودع مستندات المشتريات.
        </div>
      </section>

      <footer className={styles.totals}>
        <div>
          <span>الإجمالي التقديري</span>
          <strong>{formatMoney(total)}</strong>
          <small>{items.length} بند</small>
        </div>
        <div className={styles.headerActions}>
          <Link
            className={styles.secondaryButton}
            href="/platform/procurement"
          >
            إلغاء
          </Link>
          <SubmitButton />
        </div>
      </footer>
    </form>
  );
}
