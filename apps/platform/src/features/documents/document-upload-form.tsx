"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

import { uploadDocumentAction, type DocumentFormState } from "./actions";
import styles from "./document-upload-form.module.css";

type EntityOption = { id: string; label: string };
type EntityGroups = Record<string, EntityOption[]>;

const initialState: DocumentFormState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button className={styles.submit} disabled={pending} type="submit">{pending ? "جارٍ الرفع..." : "رفع وإرسال للمراجعة"}</button>;
}

export function DocumentUploadForm({ entities }: { entities: EntityGroups }) {
  const [open, setOpen] = useState(false);
  const [entityType, setEntityType] = useState("WORKSPACE");
  const [state, action] = useActionState(uploadDocumentAction, initialState);

  useEffect(() => {
    if (state.status === "success") setOpen(false);
  }, [state.status]);

  return <>
    <button className={styles.trigger} onClick={() => setOpen(true)} type="button">رفع مستند جديد</button>
    {open && <div className={styles.backdrop} role="presentation">
      <section aria-modal="true" className={styles.modal} role="dialog">
        <header><div><span>إضافة ملف آمن</span><h2>رفع مستند جديد</h2></div><button aria-label="إغلاق" onClick={() => setOpen(false)} type="button">×</button></header>
        <form action={action}>
          {state.status === "error" && <p className={styles.error}>{state.message}</p>}
          <div className={styles.grid}>
            <label><span>عنوان المستند *</span><input maxLength={180} name="title" required /></label>
            <label><span>التصنيف *</span><input list="document-categories" name="category" placeholder="عقد، عرض فني، شهادة..." required /><datalist id="document-categories"><option value="وثائق المنافسة" /><option value="عرض فني" /><option value="عرض مالي" /><option value="عقد" /><option value="شهادة نظامية" /><option value="محضر استلام" /></datalist></label>
            <label><span>مرتبط بـ *</span><select name="entityType" onChange={(event) => setEntityType(event.target.value)} value={entityType}><option value="WORKSPACE">مساحة العمل</option><option value="PROCUREMENT_REQUEST">طلب مشتريات</option><option value="OPPORTUNITY">منافسة</option><option value="CONTRACT">عقد</option><option value="BUSINESS_PARTNER">مورد</option><option value="PROJECT">مشروع</option></select></label>
            <label><span>السجل المرتبط</span><select disabled={entityType === "WORKSPACE"} name="entityId" required={entityType !== "WORKSPACE"}><option value="">اختر السجل</option>{(entities[entityType] ?? []).map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
            <label><span>تاريخ الانتهاء</span><input name="expiresAt" type="date" /></label>
            <label className={styles.fileField}><span>الملف * — PDF أو Word أو Excel أو صورة، حتى 10 م.ب</span><input accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png" name="file" required type="file" /></label>
            <label className={styles.notes}><span>ملاحظات</span><textarea maxLength={500} name="notes" rows={3} /></label>
            <label className={styles.check}><input name="isConfidential" type="checkbox" /><span>مستند سري — وصول مقيّد</span></label>
          </div>
          <footer><button className={styles.cancel} onClick={() => setOpen(false)} type="button">إلغاء</button><SubmitButton /></footer>
        </form>
      </section>
    </div>}
  </>;
}
