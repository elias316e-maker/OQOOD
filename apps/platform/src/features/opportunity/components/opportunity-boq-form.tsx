"use client";

import styles from "./opportunity-boq-form.module.css";

import {
  useActionState,
  useState,
} from "react";

import {
  useFormStatus,
} from "react-dom";

import Link from "next/link";

import {
  Alert,
  Button,
  WorkspaceHeader,
  FormActions,
  FormSection,
  Input,
  Select,
} from "@oqood/design-system";

import {
  saveOpportunityItemsAction,
  type OpportunityItemInput,
} from "../actions/manage-opportunity-setup";

type BoqFormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const initialState: BoqFormState = {
  status: "idle",
};

type OpportunityBoqFormProps = {
  opportunity: {
    id: string;
    number: string;
    title: string;
  };
  initialItems: OpportunityItemInput[];
};

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      variant="primary"
      disabled={pending}
      aria-busy={pending}
      type="submit"
    >
      {pending
        ? "جارٍ حفظ البنود..."
        : "حفظ جدول الكميات"}
    </Button>
  );
}

export function OpportunityBoqForm({
  opportunity,
  initialItems,
}: OpportunityBoqFormProps) {
  const [items, setItems] = useState<
    OpportunityItemInput[]
  >(
    initialItems.length
      ? initialItems
      : [
          {
            description: "",
            quantity: "1",
            unit: "قطعة",
            specification: "",
          },
        ],
  );

  const [state, formAction] =
    useActionState(
      async (): Promise<BoqFormState> => {
        const result =
          await saveOpportunityItemsAction(
            opportunity.id,
            items,
          );

        return {
          status: result.success
            ? "success"
            : "error",
          message:
            result.message,
        };
      },
      initialState,
    );

  function updateItem(
    index: number,
    field: keyof OpportunityItemInput,
    value: string,
  ): void {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  }

  function addItem(): void {
    setItems((current) => [
      ...current,
      {
        description: "",
        quantity: "1",
        unit: "قطعة",
        specification: "",
      },
    ]);
  }

  function removeItem(index: number): void {
    setItems((current) =>
      current.filter(
        (_, itemIndex) =>
          itemIndex !== index,
      ),
    );
  }

  return (
    <div className={styles.page}>
      <form action={formAction} className={styles.shell}>
        <WorkspaceHeader
          eyebrow={opportunity.number}
          title="جدول الكميات"
          description={opportunity.title}
          actions={
            <>
              <Link
                className="odsButton odsButton--outline odsButton--md"
                href={`/platform/opportunities/${opportunity.id}`}
              >
                العودة للتفاصيل
              </Link>
              <SaveButton />
            </>
          }
        />

        <nav className={styles.flow} aria-label="مراحل إعداد المنافسة">
          <Link href={`/platform/opportunities/${opportunity.id}`}>1 <span>البيانات</span></Link>
          <strong aria-current="step">2 <span>جدول الكميات</span></strong>
          <Link href={`/platform/opportunities/${opportunity.id}/partners`}>3 <span>الموردون</span></Link>
          <Link href={`/platform/opportunities/${opportunity.id}/offers`}>4 <span>العروض</span></Link>
        </nav>

        <FormSection
        className={styles.panel}
        title="بنود جدول الكميات"
        description="إدارة عناصر المنافسة وكمياتها ووحدات القياس."
      >
          <div className={styles.panelHeader}>
            <div>
              <h2>بنود جدول الكميات</h2>
              <p>
                أضف البنود والكميات والوحدات
                والمواصفات المطلوبة.
              </p>
            </div>

            <Button
              variant="primary"
              onClick={addItem}
              type="button"
            >
              + إضافة بند
            </Button>
          </div>

          {state.message && (
            <Alert
              tone={state.status === "success" ? "success" : "danger"}
              role={state.status === "success" ? "status" : "alert"}
            >
              {state.message}
            </Alert>
          )}

          <div className={styles.tableViewport} role="region" aria-label="بنود جدول الكميات" tabIndex={0}>
            <table className={styles.table}>
              <caption>بنود جدول الكميات</caption>
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">وصف البند</th>
                  <th scope="col">الكمية</th>
                  <th scope="col">الوحدة</th>
                  <th scope="col">المواصفة</th>
                  <th scope="col">الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id ?? index}>
                    <td>{index + 1}</td>
                    <td>
                      <Input
                        aria-label={`وصف البند ${index + 1}`}
                        onChange={(event) =>
                          updateItem(
                            index,
                            "description",
                            event.target.value,
                          )
                        }
                        required
                        value={item.description}
                      />
                    </td>
                    <td>
                      <Input
                        aria-label={`كمية البند ${index + 1}`}
                        min="0.0001"
                        onChange={(event) =>
                          updateItem(
                            index,
                            "quantity",
                            event.target.value,
                          )
                        }
                        required
                        step="0.0001"
                        type="number"
                        value={item.quantity}
                      />
                    </td>
                    <td>
                      <Select
                        aria-label={`وحدة البند ${index + 1}`}
                        onChange={(event) =>
                          updateItem(
                            index,
                            "unit",
                            event.target.value,
                          )
                        }
                        value={item.unit}
                      >
                        <option>قطعة</option>
                        <option>متر طولي</option>
                        <option>متر مربع</option>
                        <option>متر مكعب</option>
                        <option>طن</option>
                        <option>دفعة</option>
                      </Select>
                    </td>
                    <td>
                      <Input
                        aria-label={`مواصفة البند ${index + 1}`}
                        onChange={(event) =>
                          updateItem(
                            index,
                            "specification",
                            event.target.value,
                          )
                        }
                        value={
                          item.specification ?? ""
                        }
                      />
                    </td>
                    <td>
                      <Button
                        variant="danger" aria-label={`حذف البند ${index + 1}`}
                        disabled={
                          items.length === 1
                        }
                        onClick={() =>
                          removeItem(index)
                        }
                        type="button"
                      >
                        حذف
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.summary}>
            <article><span>عدد البنود</span><strong>{items.length}</strong></article>
            <article><span>إجمالي الكميات</span><strong>{items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0).toLocaleString("ar-SA")}</strong></article>
            <article><span>البنود المكتملة</span><strong>{items.filter((item) => item.description.trim() && Number(item.quantity) > 0).length}</strong></article>
          </div>

          <FormActions
        className={styles.footer}
        status={
          <span>
            يتم حفظ التغييرات ضمن المنافسة الحالية.
          </span>
        }
      >
            <span>
              عدد البنود: {items.length}
            </span>

            <div className={styles.actions}>
              <SaveButton />
              <Link
                className="odsButton odsButton--outline odsButton--md"
                href={`/platform/opportunities/${opportunity.id}/partners`}
              >
                الانتقال إلى شركاء الأعمال
              </Link>
            </div>
          </FormActions>
        </FormSection>
      </form>
    </div>
  );
}
