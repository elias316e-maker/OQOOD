"use client";

import styles from "./opportunity-criteria-manager.module.css";

import {
  useState,
  type FormEvent,
} from "react";

import {
  useRouter,
} from "next/navigation";

import type {
  OpportunityCriterionCategory,
  OpportunityCriterionScoringMethod,
} from "@/generated/prisma/client";

import {
  createOpportunityCriterionAction,
} from "../../../actions/create-opportunity-criterion";

import {
  deleteOpportunityCriterionAction,
} from "../../../actions/delete-opportunity-criterion";

import {
  updateOpportunityCriterionAction,
} from "../../../actions/update-opportunity-criterion";

import type {
  OpportunityCriterionResponse,
} from "../../../dtos";

import {
  Alert,
  Badge,
  Button,
  EmptyState,
  Input,
  Select,
  Textarea,
} from "@oqood/design-system";

type OpportunityCriteriaManagerProps = {
  opportunityId: string;
  criteria: OpportunityCriterionResponse[];
  totalWeight: string;
  canManage: boolean;
};

type CriterionFormState = {
  name: string;
  description: string;
  category: OpportunityCriterionCategory;
  scoringMethod: OpportunityCriterionScoringMethod;
  weight: string;
  minimumScore: string;
  required: boolean;
  active: boolean;
  displayOrder: string;
};

const emptyForm: CriterionFormState = {
  name: "",
  description: "",
  category: "TECHNICAL",
  scoringMethod: "NUMERIC",
  weight: "",
  minimumScore: "",
  required: false,
  active: true,
  displayOrder: "0",
};

const categoryLabels: Record<
  OpportunityCriterionCategory,
  string
> = {
  TECHNICAL: "فني",
  FINANCIAL: "مالي",
  COMMERCIAL: "تجاري",
  COMPLIANCE: "امتثال",
  DOCUMENT: "مستندات",
  CUSTOM: "مخصص",
};

const scoringMethodLabels: Record<
  OpportunityCriterionScoringMethod,
  string
> = {
  PASS_FAIL: "نجاح أو رسوب",
  NUMERIC: "درجة رقمية",
  PERCENTAGE: "نسبة مئوية",
  MANUAL: "تقييم يدوي",
};

export function OpportunityCriteriaManager({
  opportunityId,
  criteria,
  totalWeight,
  canManage,
}: OpportunityCriteriaManagerProps) {
  const router = useRouter();

  const [form, setForm] =
    useState<CriterionFormState>(emptyForm);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [formOpen, setFormOpen] =
    useState(false);

  const [pending, setPending] =
    useState(false);

  const [message, setMessage] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const remainingWeight = Math.max(
    0,
    100 - Number(totalWeight),
  );

  function resetForm(): void {
    setForm(emptyForm);
    setEditingId(null);
    setFormOpen(false);
    setError(null);
  }

  function startCreate(): void {
    setForm(emptyForm);
    setEditingId(null);
    setMessage(null);
    setError(null);
    setFormOpen(true);
  }

  function startEdit(
    criterion: OpportunityCriterionResponse,
  ): void {
    setEditingId(criterion.id);

    setForm({
      name: criterion.name,
      description: criterion.description ?? "",
      category: criterion.category,
      scoringMethod: criterion.scoringMethod,
      weight: criterion.weight,
      minimumScore: criterion.minimumScore ?? "",
      required: criterion.required,
      active: criterion.active,
      displayOrder: String(criterion.displayOrder),
    });

    setMessage(null);
    setError(null);
    setFormOpen(true);
  }

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    setPending(true);
    setMessage(null);
    setError(null);

    const payload = {
      opportunityId,
      name: form.name,
      description:
        form.description.trim() || null,
      category: form.category,
      scoringMethod: form.scoringMethod,
      weight: form.weight,
      minimumScore:
        form.scoringMethod === "PASS_FAIL" ||
        !form.minimumScore.trim()
          ? null
          : form.minimumScore,
      required: form.required,
      active: form.active,
      displayOrder:
        Number(form.displayOrder) || 0,
    };

    const result = editingId
      ? await updateOpportunityCriterionAction({
          ...payload,
          criterionId: editingId,
        })
      : await createOpportunityCriterionAction(
          payload,
        );

    setPending(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    setMessage(
      result.message ??
        (editingId
          ? "تم تحديث المعيار."
          : "تم إنشاء المعيار."),
    );

    resetForm();
    router.refresh();
  }

  async function removeCriterion(
    criterion: OpportunityCriterionResponse,
  ): Promise<void> {
    const confirmed = window.confirm(
      `هل تريد حذف معيار "${criterion.name}"؟`,
    );

    if (!confirmed) {
      return;
    }

    setPending(true);
    setMessage(null);
    setError(null);

    const result =
      await deleteOpportunityCriterionAction({
        opportunityId,
        criterionId: criterion.id,
      });

    setPending(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    setMessage(
      result.message ?? "تم حذف المعيار.",
    );

    if (editingId === criterion.id) {
      resetForm();
    }

    router.refresh();
  }

  return (
    <section className={styles.manager}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>
            مصفوفة التقييم
          </span>

          <h2>المعايير المعتمدة</h2>

          <p>
            إدارة الأوزان وطرق القياس وحدود النجاح
            والمتطلبات الإلزامية.
          </p>
        </div>

        {canManage && !formOpen && (
          <Button
            variant="primary"
            onClick={startCreate}
            type="button"
          >
            إضافة معيار
          </Button>
        )}
      </header>

      <div className={styles.summary}>
        <div>
          <span>إجمالي الأوزان</span>
          <strong>{Number(totalWeight)}%</strong>
        </div>

        <div>
          <span>الوزن المتبقي</span>
          <strong>{remainingWeight}%</strong>
        </div>

        <div>
          <span>عدد المعايير</span>
          <strong>{criteria.length}</strong>
        </div>
      </div>

      {message && (
        <Alert
           tone="success"
          role="status"
        >
          {message}
        </Alert>
      )}

      {error && (
        <Alert
           tone="danger"
          role="alert"
        >
          {error}
        </Alert>
      )}

      {formOpen && canManage && (
        <form
          className={styles.form}
          onSubmit={submit}
        >
          <header>
            <div>
              <span className={styles.eyebrow}>
                {editingId
                  ? "تعديل المعيار"
                  : "معيار جديد"}
              </span>

              <h3>
                {editingId
                  ? "تحديث بيانات المعيار"
                  : "إضافة معيار تقييم"}
              </h3>
            </div>

            <Button
              variant="outline"
              disabled={pending}
              onClick={resetForm}
              type="button"
            >
              إلغاء
            </Button>
          </header>

          <div className={styles.fields}>
            <Input id="criterion-name" label="اسم المعيار"
                maxLength={150}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                required
                value={form.name}
              />

            <Select id="criterion-category" label="التصنيف"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    category:
                      event.target
                        .value as OpportunityCriterionCategory,
                  }))
                }
                value={form.category}
              >
                {Object.entries(
                  categoryLabels,
                ).map(([value, label]) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {label}
                  </option>
                ))}
              </Select>

            <Select id="criterion-scoring" label="طريقة القياس"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    scoringMethod:
                      event.target
                        .value as OpportunityCriterionScoringMethod,
                    minimumScore:
                      event.target.value ===
                      "PASS_FAIL"
                        ? ""
                        : current.minimumScore,
                  }))
                }
                value={form.scoringMethod}
              >
                {Object.entries(
                  scoringMethodLabels,
                ).map(([value, label]) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {label}
                  </option>
                ))}
              </Select>

            <Input id="criterion-weight" label="الوزن (%)"
                max="100"
                min="0"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    weight: event.target.value,
                  }))
                }
                required
                step="0.01"
                type="number"
                value={form.weight}
              />

            <Input id="criterion-minimum" label="الحد الأدنى للنجاح"
                disabled={
                  form.scoringMethod ===
                  "PASS_FAIL"
                }
                max="100"
                min="0"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    minimumScore:
                      event.target.value,
                  }))
                }
                step="0.01"
                type="number"
                value={form.minimumScore}
              />

            <Input id="criterion-order" label="ترتيب العرض"
                min="0"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    displayOrder:
                      event.target.value,
                  }))
                }
                type="number"
                value={form.displayOrder}
              />

            <div className={styles.description}>
<Textarea id="criterion-description" label="الوصف"
                maxLength={1000}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description:
                      event.target.value,
                  }))
                }
                rows={4}
                value={form.description}
              />
</div>
          </div>

          <div className={styles.checks}>
            <label>
              <input
                checked={form.required}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    required:
                      event.target.checked,
                  }))
                }
                type="checkbox"
              />
              معيار إلزامي
            </label>

            <label>
              <input
                checked={form.active}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    active:
                      event.target.checked,
                  }))
                }
                type="checkbox"
              />
              معيار نشط
            </label>
          </div>

          <footer>
            <Button
              variant="primary"
              disabled={pending}
              type="submit"
            >
              {pending
                ? "جارٍ الحفظ..."
                : editingId
                  ? "حفظ التعديلات"
                  : "إضافة المعيار"}
            </Button>
          </footer>
        </form>
      )}

      {criteria.length === 0 ? (
        <EmptyState
          title="لا توجد معايير تقييم"
          description={
            canManage
              ? "أضف أول معيار لبدء بناء مصفوفة التقييم."
              : "لم تتم إضافة معايير لهذه المنافسة."
          }
        />
      ) : (
        <div className={styles.list}>
          {criteria.map((criterion) => (
            <article
              className={
                criterion.active
                  ? styles.item
                  : `${styles.item} ${styles.inactive}`
              }
              key={criterion.id}
            >
              <div className={styles.identity}>
                <span>
                  {categoryLabels[
                    criterion.category
                  ]}
                </span>

                <h3>{criterion.name}</h3>

                <p>
                  {criterion.description ??
                    "لا يوجد وصف لهذا المعيار."}
                </p>
              </div>

              <dl>
                <div>
                  <dt>الوزن</dt>
                  <dd>
                    {Number(criterion.weight)}%
                  </dd>
                </div>

                <div>
                  <dt>طريقة القياس</dt>
                  <dd>
                    {
                      scoringMethodLabels[
                        criterion.scoringMethod
                      ]
                    }
                  </dd>
                </div>

                <div>
                  <dt>حد النجاح</dt>
                  <dd>
                    {criterion.minimumScore ===
                    null
                      ? "غير محدد"
                      : Number(
                          criterion.minimumScore,
                        )}
                  </dd>
                </div>

                <div>
                  <dt>الحالة</dt>
                  <dd>
                    {criterion.active
                      ? "نشط"
                      : "غير نشط"}
                  </dd>
                </div>
              </dl>

              {criterion.required && (
                <Badge tone="warning">
                  إلزامي
                </Badge>
              )}

              {canManage && (
                <footer>
                  <Button
                    variant="outline"
                    disabled={pending}
                    onClick={() =>
                      startEdit(criterion)
                    }
                    type="button"
                  >
                    تعديل
                  </Button>

                  <Button
                    variant="danger"
                    disabled={pending}
                    onClick={() => {
                      void removeCriterion(
                        criterion,
                      );
                    }}
                    type="button"
                  >
                    حذف
                  </Button>
                </footer>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
