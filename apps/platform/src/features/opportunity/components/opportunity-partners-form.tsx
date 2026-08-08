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
    <button
      className="primaryButton compactButton"
      disabled={pending}
      type="submit"
    >
      {pending
        ? "جارٍ حفظ الشركاء..."
        : "حفظ شركاء الأعمال"}
    </button>
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
    <main className={`platformContent ${styles.setupRefresh}`}>
      <form action={formAction} className="opportunitySetupShell">
        <WorkspaceHeader
        eyebrow="{opportunity.number}"
        title="دعوة شركاء الأعمال"
        description="{opportunity.title}"
      />

        <nav className={styles.setupFlow} aria-label="مراحل إعداد المنافسة">
          <Link href={`/platform/opportunities/${opportunity.id}`}>1 <span>البيانات</span></Link>
          <Link href={`/platform/opportunities/${opportunity.id}/boq`}>2 <span>جدول الكميات</span></Link>
          <strong>3 <span>الموردون</span></strong>
          <Link href={`/platform/opportunities/${opportunity.id}/offers`}>4 <span>العروض</span></Link>
        </nav>

        <section className={styles.setupPanel}>
          <div className="wizardSectionHeader">
            <div>
              <h2>شركاء الأعمال المؤهلون</h2>
              <p>
                اختر الشركات التي ستستقبل
                الدعوة عند نشر الفرصة.
              </p>
            </div>
            <span className="selectedPartnerBadge">
              تم اختيار {selectedIds.length}
            </span>
          </div>

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
            <div className="emptyState">
              <h2>
                لا يوجد شركاء أعمال مسجلون
              </h2>
              <p>
                أضف موردًا أولًا ثم عُد لاختيار
                الشركات المدعوة.
              </p>
              <Link
                className="primaryButton compactButton"
                href="/platform/partners/new"
              >
                إضافة مورد
              </Link>
            </div>
          ) : (
            <div className="partnerSelectionList">
              {partners.map((partner) => {
                const selected =
                  selectedIds.includes(
                    partner.id,
                  );

                return (
                  <label
                    className={
                      selected
                        ? "partnerSelectionCard selected"
                        : "partnerSelectionCard"
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
                    <span className="partnerAvatar">
                      {partner.name.charAt(0)}
                    </span>
                    <span className="partnerInfo">
                      <strong>
                        {partner.name}
                        {partner.verified && (
                          <span className="verifiedBadge">
                            موثق
                          </span>
                        )}
                      </strong>
                      <small>{partner.city}</small>
                    </span>
                    <span className="partnerScore">
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

          <div className="invitationSettings">
            <div className="invitationSettings__intro">
              <span aria-hidden="true">✉</span>
              <div><strong>رسالة موحدة للموردين</strong><small>ستُرفق الرسالة مع كل دعوة عند نشر المنافسة.</small></div>
            </div>
            <div className="formField">
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
        <div className="commandHeaderActions">
              <SaveInvitationsButton />
              <Link
                className="secondaryButton compactButton"
                href={`/platform/opportunities/${opportunity.id}`}
              >
                مراجعة الفرصة
              </Link>
            </div>
      </FormActions>
        </section>
      </form>
    </main>
  );
}
