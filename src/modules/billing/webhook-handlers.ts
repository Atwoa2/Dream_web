/**
 * Stripe webhook processing — the only writer of billing tables.
 *
 * Contract:
 * - idempotent: every event id is recorded; duplicates are no-ops
 * - unknown event types are ignored on purpose (Stripe sends many)
 * - a thrown error → HTTP 500 → Stripe retries with backoff, so handlers
 *   must stay safe to re-run
 */
import type Stripe from "stripe";
import { logger } from "@/lib/logger";
import { getUserByStripeCustomerId, saveCardDisplay } from "@/modules/users";
import * as repo from "./repository";
import { stripe } from "./stripe-client";

// --- helpers ----------------------------------------------------------------

function customerId(value: string | Stripe.Customer | Stripe.DeletedCustomer | null): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

/** metadata.user_id first (we set it everywhere), customer lookup second. */
async function resolveUserId(
  metadata: Stripe.Metadata | null | undefined,
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null,
): Promise<string | null> {
  const fromMetadata = metadata?.user_id;
  if (fromMetadata) return fromMetadata;

  const id = customerId(customer);
  if (!id) return null;
  const user = await getUserByStripeCustomerId(id);
  return user?.id ?? null;
}

/**
 * Since the Basil API, current_period_end lives on subscription items.
 * A subscription with no items should not exist; fall back to "now" so a
 * malformed object degrades to "no access" rather than "eternal access".
 */
function periodEnd(subscription: Stripe.Subscription): Date {
  const ts = subscription.items.data[0]?.current_period_end;
  return ts ? new Date(ts * 1000) : new Date();
}

async function upsertFromStripeSubscription(
  subscription: Stripe.Subscription,
): Promise<void> {
  const userId = await resolveUserId(subscription.metadata, subscription.customer);
  if (!userId) {
    logger.warn("webhook: subscription with no resolvable user", {
      subscriptionId: subscription.id,
    });
    return;
  }

  await repo.upsertSubscription({
    userId,
    stripeSubscriptionId: subscription.id,
    status: subscription.status,
    priceId: subscription.items.data[0]?.price.id ?? "unknown",
    currentPeriodEnd: periodEnd(subscription),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });
}

/** Pulls brand/last4 out of an expanded payment method, if it is a card. */
function cardOf(pm: unknown): { brand: string; last4: string } | null {
  const card = (pm as { card?: { brand?: string; last4?: string } } | null)?.card;
  return card?.brand && card.last4 ? { brand: card.brand, last4: card.last4 } : null;
}

// --- event handlers ---------------------------------------------------------

async function onCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const userId = await resolveUserId(session.metadata, session.customer);
  if (!userId) {
    logger.warn("webhook: checkout session with no resolvable user", { sessionId: session.id });
    return;
  }

  // Re-retrieve with expansions: the event payload carries bare ids.
  const full = await stripe().checkout.sessions.retrieve(session.id, {
    expand: ["payment_intent.payment_method", "subscription.default_payment_method"],
  });

  if (full.mode === "subscription" && full.subscription && typeof full.subscription !== "string") {
    await upsertFromStripeSubscription(full.subscription);
    const card = cardOf(full.subscription.default_payment_method);
    if (card) await saveCardDisplay(userId, card.brand, card.last4);
    // The cycle's payment row comes from invoice.paid — not recorded here,
    // otherwise every first charge would appear twice.
    return;
  }

  if (full.mode === "payment" && full.payment_intent && typeof full.payment_intent !== "string") {
    const intent = full.payment_intent;
    await repo.recordPayment({
      userId,
      stripePaymentIntentId: intent.id,
      amountCents: full.amount_total ?? intent.amount,
      currency: full.currency ?? intent.currency,
      status: "succeeded",
      description: session.metadata?.product === "credits" ? "Credits pack" : "One-time purchase",
      invoiceUrl: null,
    });
    if (session.metadata?.product === "credits") {
      await repo.addCredits(userId, full.amount_total ?? intent.amount);
    }
    const card = cardOf(intent.payment_method);
    if (card) await saveCardDisplay(userId, card.brand, card.last4);
  }
}

/** Renewals: this is the only way to learn Stripe charged the card again. */
async function onInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  const userId = await resolveUserId(invoice.metadata ?? undefined, invoice.customer ?? null);
  if (!userId) {
    logger.warn("webhook: invoice with no resolvable user", { invoiceId: invoice.id });
    return;
  }

  await repo.recordPayment({
    userId,
    // The invoice id is the stable unique key for subscription cycles.
    stripePaymentIntentId: invoice.id ?? `invoice_${Date.now()}`,
    amountCents: invoice.amount_paid,
    currency: invoice.currency,
    status: "succeeded",
    description: "Subscription payment",
    invoiceUrl: invoice.hosted_invoice_url ?? null,
  });

  // Advance current_period_end by re-reading the subscription.
  const subId = invoice.parent?.subscription_details?.subscription;
  const id = typeof subId === "string" ? subId : subId?.id;
  if (id) {
    const subscription = await stripe().subscriptions.retrieve(id);
    await upsertFromStripeSubscription(subscription);
  }
}

async function onInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const subId = invoice.parent?.subscription_details?.subscription;
  const id = typeof subId === "string" ? subId : subId?.id;
  if (id) await repo.setSubscriptionStatus(id, "past_due");
  // Access itself survives the grace window — see hasActiveAccess().
}

// --- dispatcher -------------------------------------------------------------

export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  const fresh = await repo.markEventProcessed(event.id, event.type);
  if (!fresh) {
    logger.info("webhook: duplicate event ignored", { eventId: event.id });
    return;
  }

  switch (event.type) {
    case "checkout.session.completed":
      await onCheckoutCompleted(event.data.object);
      break;
    case "customer.subscription.updated":
      await upsertFromStripeSubscription(event.data.object);
      break;
    case "customer.subscription.deleted":
      await repo.setSubscriptionStatus(event.data.object.id, "canceled");
      break;
    case "invoice.paid":
      await onInvoicePaid(event.data.object);
      break;
    case "invoice.payment_failed":
      await onInvoicePaymentFailed(event.data.object);
      break;
    default:
      // Deliberately ignored: Stripe emits dozens of event types.
      break;
  }
}
