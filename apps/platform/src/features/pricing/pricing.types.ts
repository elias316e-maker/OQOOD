export type BillingCycle = "monthly" | "yearly";

export type PricingPlanTone =
  | "blue"
  | "purple"
  | "cyan"
  | "green";

export type PricingPlan = {
  id: string;
  name: string;
  nameAr: string;
  audience: string;
  description: string;
  monthlyPrice?: number;
  yearlyPrice?: number;
  currency: string;
  customPrice?: boolean;
  recommended?: boolean;
  tone: PricingPlanTone;
  ctaLabel: string;
  ctaHref: string;
  features: string[];
};

export type PricingPageData = {
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    yearlySavingLabel: string;
  };
  plans: PricingPlan[];
};
