"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { createProjectAction, type ProjectFormState } from "./actions";
import styles from "./project-create-form.module.css";

const initialState: ProjectFormState = { status: "idle" };

export function ProjectCreateForm({ defaultCurrency }: { defaultCurrency: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(createProjectAction, initialState);
  useEffect(() => {
    if (state.status === "success" && state.projectId) {
      router.replace(`/platform/projects/${state.projectId}`);
      router.refresh();
    }
  }, [router, state.projectId, state.status]);

  return <form action={action} className={styles.form}>
    {state.status === "error" && <p className={styles.error}>{state.message}</p>}
    <section><header><span>01</span><div><h2>هوية المشروع</h2><p>الرمز والاسم والوصف التشغيلي.</p></div></header><div className={styles.grid}>
      <label><span>رمز المشروع *</span><input maxLength={30} name="code" pattern="[A-Za-z0-9-]+" placeholder="PRJ-2026-001" required /></label>
      <label><span>الاسم بالعربية *</span><input maxLength={180} name="nameAr" required /></label>
      <label><span>الاسم بالإنجليزية</span><input maxLength={180} name="nameEn" /></label>
      <label className={styles.wide}><span>الوصف</span><textarea maxLength={1000} name="description" rows={4} /></label>
    </div></section>
    <section><header><span>02</span><div><h2>الخطة المالية والزمنية</h2><p>الميزانية والعملة والتواريخ المستهدفة.</p></div></header><div className={styles.grid}>
      <label><span>الميزانية</span><input min="0" name="budget" step="0.01" type="number" /></label>
      <label><span>العملة</span><select defaultValue={defaultCurrency} name="currency"><option value="SAR">ريال سعودي</option><option value="USD">دولار أمريكي</option><option value="AED">درهم إماراتي</option></select></label>
      <label><span>تاريخ البداية</span><input name="startDate" type="date" /></label>
      <label><span>تاريخ الانتهاء</span><input name="endDate" type="date" /></label>
    </div></section>
    <footer><button className={styles.cancel} onClick={() => router.back()} type="button">إلغاء</button><button className={styles.submit} disabled={pending} type="submit">{pending ? "جارٍ إنشاء المشروع..." : "إنشاء المشروع"}</button></footer>
  </form>;
}
