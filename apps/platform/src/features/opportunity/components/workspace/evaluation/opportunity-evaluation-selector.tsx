"use client";

import {
  useState,
} from "react";

import type {
  OpportunityOfferData,
} from "../../../actions/manage-opportunity-offers";

import {
  OfferEvaluationManager,
} from "./offer-evaluation-manager";

type OpportunityEvaluationSelectorProps = {
  data: OpportunityOfferData;
  canEvaluate: boolean;
};

export function OpportunityEvaluationSelector({
  data,
  canEvaluate,
}: OpportunityEvaluationSelectorProps) {
  const [selectedOfferId, setSelectedOfferId] =
    useState<string | null>(
      data.offers[0]?.id ?? null,
    );

  function formatMoney(
    value: string | number,
  ): string {
    try {
      return new Intl.NumberFormat("ar-SA", {
        style: "currency",
        currency: data.opportunity.currency,
        maximumFractionDigits: 2,
      }).format(Number(value));
    } catch {
      return String(value);
    }
  }

  return (
    <>
      <section className="opportunityWorkspaceCard">
        {data.offers.length === 0 ? (
          <div className="opportunityWorkspaceEmptyPanel">
            <span className="opportunityWorkspaceEmptyPanel__icon">
              ◫
            </span>

            <h2>لا توجد عروض للتقييم</h2>

            <p>
              يجب تسجيل عروض الموردين أولًا قبل بدء التقييم.
            </p>
          </div>
        ) : (
          <div className="opportunityEvaluationWorkspace__table">
            <table>
              <thead>
                <tr>
                  <th>المورد</th>
                  <th>رقم العرض</th>
                  <th>الحالة</th>
                  <th>القيمة الإجمالية</th>
                  <th>مدة التسليم</th>
                  <th>الصلاحية</th>
                  <th>التقييم</th>
                </tr>
              </thead>

              <tbody>
                {data.offers.map((offer) => {
                  const selected =
                    offer.id === selectedOfferId;

                  return (
                    <tr
                      className={
                        selected
                          ? "is-selected"
                          : undefined
                      }
                      key={offer.id}
                    >
                      <td>
                        <strong>
                          {offer.partnerName}
                        </strong>
                      </td>

                      <td>
                        {offer.referenceNumber ?? "—"}
                      </td>

                      <td>
                        <span
                          className={
                            `opportunityEvaluationStatus ` +
                            `status-${offer.status.toLowerCase()}`
                          }
                        >
                          {offer.status}
                        </span>
                      </td>

                      <td>
                        {formatMoney(
                          offer.totalAmount,
                        )}
                      </td>

                      <td>
                        {offer.deliveryDays
                          ? `${offer.deliveryDays} يوم`
                          : "—"}
                      </td>

                      <td>
                        {offer.validityDays
                          ? `${offer.validityDays} يوم`
                          : "—"}
                      </td>

                      <td>
                        <button
                          className={
                            selected
                              ? "primaryButton compactButton"
                              : "secondaryButton compactButton"
                          }
                          onClick={() =>
                            setSelectedOfferId(
                              offer.id,
                            )
                          }
                          type="button"
                        >
                          {selected
                            ? "العرض المحدد"
                            : "فتح التقييم"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <OfferEvaluationManager
        offerId={selectedOfferId}
        canEvaluate={canEvaluate}
      />
    </>
  );
}
