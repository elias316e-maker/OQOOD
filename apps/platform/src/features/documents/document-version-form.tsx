"use client";

import { useActionState, useEffect, useState } from "react";

import {
  createDocumentVersionAction,
  type DocumentFormState,
} from "./actions";
import styles from "./document-version-form.module.css";

const initialState: DocumentFormState = { status: "idle" };

export function DocumentVersionForm({ documentId }: { documentId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createDocumentVersionAction, initialState);
  useEffect(() => {
    if (state.status === "success") setOpen(false);
  }, [state.status]);

  if (!open) {
    return <button className={styles.trigger} onClick={() => setOpen(true)} type="button">إصدار جديد</button>;
  }
  return <form action={action} className={styles.form}>
    <input name="documentId" type="hidden" value={documentId} />
    <input accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png" name="file" required type="file" />
    <input maxLength={500} name="notes" placeholder="ملاحظات الإصدار" />
    {state.status === "error" && <small>{state.message}</small>}
    <div><button disabled={pending} type="submit">{pending ? "جارٍ الرفع..." : "حفظ الإصدار"}</button><button onClick={() => setOpen(false)} type="button">إلغاء</button></div>
  </form>;
}
