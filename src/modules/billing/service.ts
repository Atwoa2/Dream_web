/**
 * Billing business rules: Checkout, Billing Portal, and what pages read.
 *
 * Pages read OUR tables only. The Stripe API is called when the user acts
 * (checkout, portal) and inside webhook handlers — never to render.
 */
import type Stripe from "stripe";
import { BILLING } from "@/config/constants";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { getUser, linkStripeCustomer } from "@/modules/users";
import * as repo from "./repository";
import { stripe } from "./stripe-client";
import type { CheckoutProduct, Payment, PaymentMethodDisplay, Subscription } from "./types";

/** One Stripe Customer per user, created lazily on first billing action. */
export async function ensureStripeCustomer(userId: string): Promise<string> {
  const user = await getUser(userId);
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const customer = await stripe().customers.create({
    email: user.email,
    name: user.name ?? undefined,
    // The reverse link: webhooks resolve the user through this.
    metadata: { user_id: userId },
  });
  await linkStripeCustomer(userId, customer.id);
  return customer.id;
}

function priceFor(product: CheckoutProduct): string {
  const price =
    product === "subscription" ? env.STRIPE_PRICE_SUBSCRIPTION : env.STRIPE_PRICE_CREDITS_PACK;
  if (!price) {
    throw new AppError("INTERNAL", `Stripe price for "${product}" is not configured`);
  }
  return price;
}

export async function createCheckoutSession(
  userId: string,
  product: CheckoutProduct,
): Promise<{ url: string }> {
  const customerId = await ensureStripeCustomer(userId);

  const session = await stripe().checkout.sessions.create({
    customer: customerId,
    mode: product === "subscription" ? "subscription" : "payment",
    line_items: [{ price: priceFor(product), quantity: 1 }],
    // success_url is a UX nicety only — access is granted by the webhook.
    success_url: `${env.APP_URL}/billing?status=success`,
    cancel_url: `${env.APP_URL}/billing?status=canceled`,
    client_reference_id: userId,
    metadata: { user_id: userId, product },
    ...(product === "subscription"
      ? { subscription_data: { metadata: { user_id: userId } } }
      : {}),
  });

  if (!session.url) throw new AppError("INTERNAL", "Stripe returned no checkout URL");
  return { url: session.url };
}

/** Card changes, cancellation, plan switches, invoices — all Stripe's UI. */
export async function createBillingPortalSession(userId: string): Promise<{ url: string }> {
  const customerId = await ensureStripeCustomer(userId);
  const session = await stripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${env.APP_URL}/billing`,
  });
  return { url: session.url };
}

// --- what the Billing tab reads (our DB only) -------------------------------

export async function getSubscription(userId: string): Promise<Subscription | null> {
  return repo.findSubscriptionForUser(userId);
}

export async function listPayments(userId: string): Promise<Payment[]> {
  return repo.listPaymentsForUser(userId);
}

export async function getCreditsBalance(userId: string): Promise<number> {
  return repo.getCreditsBalance(userId);
}

export async function getPaymentMethod(userId: string): Promise<PaymentMethodDisplay | null> {
  const user = await getUser(userId);
  if (!user.cardBrand) return null;
  return { brand: user.cardBrand, last4: user.cardLast4 };
}

export async function hasActiveAccess(userId: string): Promise<boolean> {
  const sub = await repo.findSubscriptionForUser(userId);
  if (!sub) return false;

  const statuses: readonly string[] = BILLING.ACTIVE_STATUSES;
  if (statuses.includes(sub.status)) return sub.currentPeriodEnd > new Date();

  // past_due keeps access during the grace window while Stripe retries the
  // charge — cutting off instantly loses clients over a reissued card.
  if (sub.status === "past_due") {
    const graceEnd = new Date(
      sub.currentPeriodEnd.getTime() + BILLING.PAST_DUE_GRACE_DAYS * 24 * 60 * 60 * 1000,
    );
    return graceEnd > new Date();
  }

  return false;
}

/** Re-exported for the webhook handler module. */
export type { Stripe };
