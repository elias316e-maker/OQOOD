"use client";

import { useState } from "react";
import { PricingHero } from "@/components/pricing/hero";
import { PricingPlans } from "@/components/pricing/plans";
import {
  pricingPageData,
  type BillingCycle,
} from "@/features/pricing";
import styles from "./page.module.css";

export default function PricingPage() {
  const [cycle, setCycle] =
    useState<BillingCycle>("yearly");

  return (
    <main className={styles.page}>
      <PricingHero
        cycle={cycle}
        description={pricingPageData.hero.description}
        eyebrow={pricingPageData.hero.eyebrow}
        onCycleChange={setCycle}
        title={pricingPageData.hero.title}
        yearlySavingLabel={
          pricingPageData.hero.yearlySavingLabel
        }
      />

      <PricingPlans
        cycle={cycle}
        plans={pricingPageData.plans}
      />

      <section className={styles.placeholder}>
        <span>المرحلة التالية</span>
        <h2>مقارنة المزايا وطرق الدفع</h2>
        <p>
          سيتم تنفيذ جدول المقارنة، وسائل الدفع، والأسئلة
          الشائعة في المرحلة التالية.
        </p>
      </section>
    </main>
  );
}
