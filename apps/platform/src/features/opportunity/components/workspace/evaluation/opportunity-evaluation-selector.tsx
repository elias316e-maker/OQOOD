"use client";

import styles from "./evaluation-tables.module.css";

import { Badge, Button, DashboardPanel, EmptyState } from "@oqood/design-system";

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
      <DashboardPanel>
        {data.offers.length === 0 ? (
          <EmptyState
            title="لا توجد عروض للتقييم"
            description="يجب تسجيل عروض الموردين أولًا قبل بدء التقييم."
          />
        ) : (
          <div className={styles.tableViewport} role="region" aria-label="اختيار العرض للتقييم الفني" tabIndex={0}>
            <table className={styles.table}>
              <caption>اختيار العرض للتقييم الفني</caption>
              <thead>
                <tr>
                  <th scope="col">المورد</th>
                  <th scope="col">رقم العرض</th>
                  <th scope="col">الحالة</th>
                  <th scope="col">القيمة الإجمالية</th>
                  <th scope="col">مدة التسليم</th>
                  <th scope="col">الصلاحية</th>
                  <th scope="col">التقييم</th>
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
                          ? styles.selected
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
                        <Badge tone="neutral">
                          {offer.status}
                        </Badge>
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
                        <Button
                          variant={selected ? "primary" : "outline"}
                          aria-pressed={selected}
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
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </DashboardPanel>

      <OfferEvaluationManager
        offerId={selectedOfferId}
        canEvaluate={canEvaluate}
      />
    </>
  );
}
