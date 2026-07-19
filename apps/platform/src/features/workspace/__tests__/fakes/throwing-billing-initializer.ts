import type {
  BillingInitializer,
} from "@/features/billing";

export class ThrowingBillingInitializer
  implements BillingInitializer
{
  async initialize(): Promise<never> {
    throw new Error(
      "Injected Billing Failure",
    );
  }
}
