/** What we sell through Checkout. Maps to a Stripe price via env variables. */
export type CheckoutProduct = "subscription" | "credits";

export type Subscription = {
  stripeSubscriptionId: string;
  status: string;
  priceId: string;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
};

export type Payment = {
  id: string;
  amountCents: number;
  currency: string;
  status: string;
  description: string | null;
  invoiceUrl: string | null;
  createdAt: Date;
};

export type PaymentMethodDisplay = {
  brand: string;
  /** null for wallets (Link, PayPal) that expose no digits. */
  last4: string | null;
};
