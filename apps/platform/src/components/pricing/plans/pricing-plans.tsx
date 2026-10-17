import Link from "next/link";
import type {
  BillingCycle,
  PricingPlan,
} from "@/features/pricing";
import styles from "./pricing-plans.module.css";

type PricingPlansProps = {
  plans: PricingPlan[];
  cycle: BillingCycle;
};

function getPrice(plan: PricingPlan, cycle: BillingCycle) {
  if (plan.customPrice) {
    return "تخصيص";
  }

  return cycle === "monthly"
    ? plan.monthlyPrice?.toLocaleString("ar-SA")
    : plan.yearlyPrice?.toLocaleString("ar-SA");
}

export function PricingPlans({
  plans,
  cycle,
}: PricingPlansProps) {
  return (
    <section className={styles.section}>
      <div className={styles.grid}>
        {plans.map((plan) => (
          <article
            className={[
              styles.card,
              styles[`tone-${plan.tone}`],
              plan.recommended ? styles.recommended : "",
            ]
              .filter(Boolean)
              .join(" ")}
            key={plan.id}
          >
            {plan.recommended ? (
              <span className={styles.recommendedBadge}>
                الاختيار الأفضل
              </span>
            ) : null}

            <header>
              <span>{plan.name}</span>
              <h2>{plan.nameAr}</h2>
              <p>{plan.audience}</p>
            </header>

            <div className={styles.price}>
              <strong>{getPrice(plan, cycle)}</strong>

              {!plan.customPrice ? (
                <span>
                  {plan.currency}
                  {" / "}
                  {cycle === "monthly" ? "شهر" : "سنة"}
                </span>
              ) : (
                <span>سعر مخصص حسب الاحتياج</span>
              )}
            </div>

            <p className={styles.description}>
              {plan.description}
            </p>

            <Link className={styles.cta} href={plan.ctaHref}>
              {plan.ctaLabel}
            </Link>

            <ul>
              {plan.features.map((feature) => (
                <li key={feature}>
                  <span aria-hidden="true">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
