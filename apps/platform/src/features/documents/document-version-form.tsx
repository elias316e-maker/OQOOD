"use client";

import {
  useActionState,
  useState,
} from "react";

import {
  Alert,
  FormActions,
} from "@oqood/design-system";

import {
  createDocumentVersionAction,
  type DocumentFormState,
} from "./actions";

import styles from "./document-version-form.module.css";

const initialState: DocumentFormState = {
  status: "idle",
};

type DocumentVersionFormProps = {
  documentId: string;
};

export function DocumentVersionForm({
  documentId,
}: DocumentVersionFormProps) {
  const [open, setOpen] = useState(false);

  const [state, action, pending] =
    useActionState(
      async (
        previousState:
          DocumentFormState,
        formData: FormData,
      ) => {
        const nextState =
          await createDocumentVersionAction(
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

  if (!open) {
    return (
      <button
        className={styles.trigger}
        onClick={() =>
          setOpen(true)
        }
        type="button"
      >
        إصدار جديد
      </button>
    );
  }

  return (
    <form
      action={action}
      className={styles.form}
    >
      <input
        name="documentId"
        type="hidden"
        value={documentId}
      />

      <label
        className={styles.field}
        htmlFor={`document-version-file-${documentId}`}
      >
        <span>ملف الإصدار الجديد</span>

        <input
          accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png"
          id={`document-version-file-${documentId}`}
          name="file"
          required
          type="file"
        />
      </label>

      <label
        className={styles.field}
        htmlFor={`document-version-notes-${documentId}`}
      >
        <span>ملاحظات الإصدار</span>

        <input
          id={`document-version-notes-${documentId}`}
          maxLength={500}
          name="notes"
          placeholder="ملاحظات الإصدار"
        />
      </label>

      {state.status === "error" ? (
        <Alert
          className={styles.feedback}
          tone="danger"
          aria-live="assertive"
        >
          {state.message}
        </Alert>
      ) : null}

      <FormActions
        className={styles.actions}
      >
        <button
          className={styles.primary}
          disabled={pending}
          type="submit"
        >
          {pending
            ? "جارٍ الرفع..."
            : "حفظ الإصدار"}
        </button>

        <button
          className={styles.secondary}
          disabled={pending}
          onClick={() =>
            setOpen(false)
          }
          type="button"
        >
          إلغاء
        </button>
      </FormActions>
    </form>
  );
}
