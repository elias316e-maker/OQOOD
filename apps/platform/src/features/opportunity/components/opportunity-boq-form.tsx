"use client";

import {
  useActionState,
  useState,
} from "react";

import {
  useFormStatus,
} from "react-dom";

import Link from "next/link";

import {
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
    <button
      className="primaryButton compactButton"
      disabled={pending}
      type="submit"
    >
      {pending
        ? "جارٍ حفظ البنود..."
        : "حفظ جدول الكميات"}
    </button>
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
    <main className="platformContent">
      <form action={formAction}>
        <section className="listPageHeader">
          <div>
            <span className="pageEyebrow">
              {opportunity.number}
            </span>
            <h1>جدول الكميات</h1>
            <p>{opportunity.title}</p>
          </div>

          <div className="commandHeaderActions">
            <Link
              className="secondaryButton compactButton"
              href={`/platform/opportunities/${opportunity.id}`}
            >
              العودة للتفاصيل
            </Link>
            <SaveButton />
          </div>
        </section>

        <section className="wizardContent opportunitySetupPanel">
          <div className="wizardSectionHeader">
            <div>
              <h2>بنود جدول الكميات</h2>
              <p>
                أضف البنود والكميات والوحدات
                والمواصفات المطلوبة.
              </p>
            </div>

            <button
              className="primaryButton compactButton"
              onClick={addItem}
              type="button"
            >
              + إضافة بند
            </button>
          </div>

          {state.message && (
            <div
              className={
                state.status === "success"
                  ? "formAlert formAlertSuccess"
                  : "formAlert formAlertError"
              }
              role={
                state.status === "success"
                  ? "status"
                  : "alert"
              }
            >
              {state.message}
            </div>
          )}

          <div className="boqTableWrapper">
            <table className="dataTable boqTable">
              <thead>
                <tr>
                  <th>#</th>
                  <th>وصف البند</th>
                  <th>الكمية</th>
                  <th>الوحدة</th>
                  <th>المواصفة</th>
                  <th>الإجراء</th>
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
                      <button
                        className="tableActionButton dangerText"
                        disabled={
                          items.length === 1
                        }
                        onClick={() =>
                          removeItem(index)
                        }
                        type="button"
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="wizardFooter">
            <span>
              عدد البنود: {items.length}
            </span>

            <div className="commandHeaderActions">
              <SaveButton />
              <Link
                className="secondaryButton compactButton"
                href={`/platform/opportunities/${opportunity.id}/partners`}
              >
                الانتقال إلى شركاء الأعمال
              </Link>
            </div>
          </div>
        </section>
      </form>
    </main>
  );
}

