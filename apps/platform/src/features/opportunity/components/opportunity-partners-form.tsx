"use client";

import styles from "./opportunity-partners-form.module.css";

import {
  useActionState,
  useState,
  } from "react";

import {
  useFormStatus,
  } from "react-dom";

import Link from "next/link";

import {
  Badge,
  Button,
  EmptyState,
  FormSection,
  Textarea,
  Alert,
  WorkspaceHeader,
  FormActions,
} from "@oqood/design-system";

import {
  saveOpportunityInvitationsAction,
} from "../actions/manage-opportunity-setup";

type PartnersFormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const initialState: PartnersFormState = {
  status: "idle",
};

type OpportunityPartnersFormProps = {
  opportunity: {
    id: string;
    number: string;
    title: string;
  };
  partners: Array<{
    id: string;
    name: string;
    city: string;
    trustScore: string;
    verified: boolean;
  }>;
  initialPartnerIds: string[];
  initialMessage: string;
};

function SaveInvitationsButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      aria-busy={pending}
      disabled={pending}
      type="submit"
    >
      {pending
        ? "جارٍ حفظ الشركاء..."
        : "حفظ شركاء الأعمال"}
    </Button>
  );
}

export function OpportunityPartnersForm({
  opportunity,
  partners,
  initialPartnerIds,
  initialMessage,
}: OpportunityPartnersFormProps) {
  const [selectedIds, setSelectedIds] =
    useState<string[]>(initialPartnerIds);
  const [message, setMessage] =
    useState(initialMessage);

  const [state, formAction] =
    useActionState(
      async (): Promise<PartnersFormState> => {
        const result =
          await saveOpportunityInvitationsAction(
            opportunity.id,
            selectedIds,
            message,
          );

        return {
          status: result.success
            ? "success"
            : "error",
          message: result.message,
        };
      },
      initialState,
    );

  function togglePartner(
    partnerId: string,
  ): void {
    setSelectedIds((current) =>
      current.includes(partnerId)
        ? current.filter(
            (value) => value !== partnerId,
          )
        : [...current, partnerId],
    );
  }

  return (
    <div className={styles.workspace}>
      <form action={formAction} className={styles.shell}>
        <WorkspaceHeader
        eyebrow={opportunity.number}
        title="دعوة شركاء الأعمال"
        description={opportunity.title}
      />

        <nav className={styles.setupFlow} aria-label="مراحل إعداد المنافسة">
          <Link href={`/platform/opportunities/${opportunity.id}`}>1 <span>البيانات</span></Link>
          <Link href={`/platform/opportunities/${opportunity.id}/boq`}>2 <span>جدول الكميات</span></Link>
          <strong aria-current="step">3 <span>الموردون</span></strong>
          <Link href={`/platform/opportunities/${opportunity.id}/offers`}>4 <span>العروض</span></Link>
        </nav>

        <FormSection
          className={styles.panel}
          title="شركاء الأعمال المؤهلون"
          description="اختر الشركات التي ستستقبل الدعوة عند نشر المنافسة."
          actions={<Badge tone="neutral">تم اختيار {selectedIds.length}</Badge>}
        >

          {state.message && (
            <Alert
          tone={
            state.status === "success"
              ? "success"
              : "danger"
          }

              role={
                state.status === "success"
                  ? "status"
                  : "alert"
              }
            >
              {state.message}
            </Alert>
          )}

          {partners.length === 0 ? (
            <EmptyState
              title="لا يوجد شركاء أعمال مسجلون"
              description="أضف موردًا أولًا ثم عُد لاختيار الشركات المدعوة."
              actions={
                <Link
                  className="odsButton odsButton--primary odsButton--md"
                  href="/platform/partners/new"
                >
                  إضافة مورد
                </Link>
              }
            />
          ) : (
            <div className={styles.list}>
              {partners.map((partner) => {
                const selected =
                  selectedIds.includes(
                    partner.id,
                  );

                return (
                  <label
                    className={
                      selected
                        ? `${styles.card} ${styles.selected}`
                        : styles.card
                    }
                    key={partner.id}
                  >
                    <input
                      checked={selected}
                      onChange={() =>
                        togglePartner(
                          partner.id,
                        )
                      }
                      type="checkbox"
                    />
                    <span className={styles.avatar}>
                      {partner.name.charAt(0)}
                    </span>
                    <span className={styles.info}>
                      <strong>
                        {partner.name}
                        {partner.verified && (
                          <Badge tone="success">موثق</Badge>
                        )}
                      </strong>
                      <small>{partner.city}</small>
                    </span>
                    <span className={styles.score}>
                      <small>درجة الثقة</small>
                      <strong>
                        {partner.trustScore}
                      </strong>
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          <div className={styles.invitation}>
            <div className={styles.intro}>
              <span aria-hidden="true">✉</span>
              <div><strong>رسالة موحدة للموردين</strong><small>ستُرفق الرسالة مع كل دعوة عند نشر المنافسة.</small></div>
            </div>
            <div className={styles.field}>
              <label htmlFor="invitationMessage">
                رسالة الدعوة
              </label>
              <Textarea
                id="invitationMessage"
                onChange={(event) =>
                  setMessage(event.target.value)
                }
                rows={4}
                value={message}
              />
            </div>
          </div>

          <FormActions
        status="ستُحفظ الدعوات بحالة معلقة حتى نشر الفرصة."
      >
        <div className={styles.actions}>
              <SaveInvitationsButton />
              <Link
                className="odsButton odsButton--outline odsButton--md"
                href={`/platform/opportunities/${opportunity.id}`}
              >
                مراجعة الفرصة
              </Link>
            </div>
      </FormActions>
        </FormSection>
      </form>
    </div>
  );
}
