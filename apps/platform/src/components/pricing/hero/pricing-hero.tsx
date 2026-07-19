"use client";

import { useState } from "react";
import type { BillingCycle } from "@/features/pricing";
import styles from "./pricing-hero.module.css";

type PricingHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  yearlySavingLabel: string;
  cycle: BillingCycle;
  onCycleChange: (cycle: BillingCycle) => void;
};

export function PricingHero({
  eyebrow,
  title,
  description,
  yearlySavingLabel,
  cycle,
  onCycleChange,
}: PricingHeroProps) {
  const [focused, setFocused] = useState(false);

  return (
    <section className={styles.hero}>
      <div className={styles.glowOne} />
      <div className={styles.glowTwo} />
      <div className={styles.grid} />

      <div className={styles.content}>
        <span className={styles.eyebrow}>{eyebrow}</span>

        <h1>{title}</h1>

        <p>{description}</p>

        <div
          className={[
            styles.billingSwitch,
            focused ? styles.billingSwitchFocused : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onBlur={() => setFocused(false)}
          onFocus={() => setFocused(true)}
        >
          <button
            className={cycle === "monthly" ? styles.active : ""}
            onClick={() => onCycleChange("monthly")}
            type="button"
          >
            شهري
          </button>

          <button
            className={cycle === "yearly" ? styles.active : ""}
            onClick={() => onCycleChange("yearly")}
            type="button"
          >
            سنوي
          </button>

          <span>{yearlySavingLabel}</span>
        </div>
      </div>
    </section>
  );
}
