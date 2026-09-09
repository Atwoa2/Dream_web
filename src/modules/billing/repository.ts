/**
 * Store access for billing. All rows here are written by webhook handlers —
 * pages only ever read.
 *
 * Firestore layout — Stripe ids as document IDs make every write idempotent:
 *   processed_events/{eventId}
 *   subscriptions/{stripeSubscriptionId}     (field userId for lookups)
 *   payments/{stripePaymentId}               (PaymentIntent or Invoice id)
 *   credits/{userId}                         (balanceCents via increment)
 */
import { store } from "@/lib/firebase-store";
import type { Payment, Subscription } from "./types";

const PROCESSED_EVENTS = "processed_events";
const SUBSCRIPTIONS = "subscriptions";
const PAYMENTS = "payments";
const CREDITS = "credits";

// --- idempotency ------------------------------------------------------------

/**
 * Records the event id; returns false when it was already processed.
 * Stripe delivers "at least once" — duplicates must be no-ops. create()
 * refuses to overwrite an existing doc, which is exactly the guarantee.
 */
export async function markEventProcessed(eventId: string, type: string): Promise<boolean> {
  return store.create(PROCESSED_EVENTS, eventId, {
    type,
    processedAt: new Date(),
  });
}

// --- subscriptions ----------------------------------------------------------

type SubscriptionDoc = {
  userId: string;
  status: string;
  priceId: string;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export async function upsertSubscription(input: {
  userId: string;
  stripeSubscriptionId: string;
  status: string;
  priceId: string;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}): Promise<void> {
  const { stripeSubscriptionId, ...fields } = input;
  await store.transaction(async (tx, db) => {
    const ref = db.collection(SUBSCRIPTIONS).doc(stripeSubscriptionId);
    const doc = await tx.get(ref);
    const now = new Date();
    if (doc.exists) {
      tx.update(ref, { ...fields, updatedAt: now });
    } else {
      tx.set(ref, { ...fields, createdAt: now, updatedAt: now });
    }
  });
}

export async function setSubscriptionStatus(
  stripeSubscriptionId: string,
  status: string,
): Promise<void> {
  await store.update(SUBSCRIPTIONS, stripeSubscriptionId, {
    status,
    updatedAt: new Date(),
  });
}

export async function findSubscriptionForUser(userId: string): Promise<Subscription | null> {
  const rows = await store.query<SubscriptionDoc>(SUBSCRIPTIONS, [["userId", "==", userId]]);
  if (rows.length === 0) return null;

  // Newest first; a user has at most a handful of subscription rows ever.
  rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const row = rows[0]!;
  return {
    stripeSubscriptionId: row.id,
    status: row.status,
    priceId: row.priceId,
    currentPeriodEnd: row.currentPeriodEnd,
    cancelAtPeriodEnd: row.cancelAtPeriodEnd,
  };
}

// --- payments ---------------------------------------------------------------

type PaymentDoc = {
  userId: string;
  amountCents: number;
  currency: string;
  status: string;
  description: string | null;
  invoiceUrl: string | null;
  createdAt: Date;
};

/**
 * The document id holds the PaymentIntent id for one-time charges and the
 * Invoice id for subscription cycles — either way it is unique, so recording
 * is idempotent: a duplicate webhook hits create() and is refused.
 */
export async function recordPayment(input: {
  userId: string;
  stripePaymentIntentId: string;
  amountCents: number;
  currency: string;
  status: string;
  description: string | null;
  invoiceUrl: string | null;
}): Promise<void> {
  const { stripePaymentIntentId, ...fields } = input;
  await store.create(PAYMENTS, stripePaymentIntentId, {
    ...fields,
    createdAt: new Date(),
  });
}

export async function listPaymentsForUser(userId: string, limit = 20): Promise<Payment[]> {
  const rows = await store.query<PaymentDoc>(PAYMENTS, [["userId", "==", userId]], {
    limit: 200,
  });
  rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return rows.slice(0, limit).map((row) => ({
    id: row.id,
    amountCents: row.amountCents,
    currency: row.currency,
    status: row.status,
    description: row.description ?? null,
    invoiceUrl: row.invoiceUrl ?? null,
    createdAt: row.createdAt,
  }));
}

// --- credits ----------------------------------------------------------------

export async function addCredits(userId: string, amountCents: number): Promise<void> {
  // FieldValue.increment — atomic on the server, no read-modify-write race.
  await store.increment(CREDITS, userId, "balanceCents", amountCents, {
    updatedAt: new Date(),
  });
}

export async function getCreditsBalance(userId: string): Promise<number> {
  const doc = await store.get<{ balanceCents: number }>(CREDITS, userId);
  return doc?.balanceCents ?? 0;
}
