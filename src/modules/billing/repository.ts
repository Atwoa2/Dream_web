/**
 * DB access for billing. All rows here are written by webhook handlers —
 * pages only ever read.
 */
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { credits, payments, processedEvents, subscriptions } from "@/db/schema";
import type { Payment, Subscription } from "./types";

// --- idempotency ------------------------------------------------------------

/**
 * Records the event id; returns false when it was already processed.
 * Stripe delivers "at least once" — duplicates must be no-ops.
 */
export async function markEventProcessed(eventId: string, type: string): Promise<boolean> {
  const inserted = await db
    .insert(processedEvents)
    .values({ stripeEventId: eventId, type })
    .onConflictDoNothing()
    .returning({ id: processedEvents.stripeEventId });
  return inserted.length > 0;
}

// --- subscriptions ----------------------------------------------------------

export async function upsertSubscription(input: {
  userId: string;
  stripeSubscriptionId: string;
  status: string;
  priceId: string;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}): Promise<void> {
  await db
    .insert(subscriptions)
    .values(input)
    .onConflictDoUpdate({
      target: subscriptions.stripeSubscriptionId,
      set: {
        status: input.status,
        priceId: input.priceId,
        currentPeriodEnd: input.currentPeriodEnd,
        cancelAtPeriodEnd: input.cancelAtPeriodEnd,
        updatedAt: new Date(),
      },
    });
}

export async function setSubscriptionStatus(
  stripeSubscriptionId: string,
  status: string,
): Promise<void> {
  await db
    .update(subscriptions)
    .set({ status, updatedAt: new Date() })
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));
}

export async function findSubscriptionForUser(userId: string): Promise<Subscription | null> {
  const [row] = await db
    .select({
      stripeSubscriptionId: subscriptions.stripeSubscriptionId,
      status: subscriptions.status,
      priceId: subscriptions.priceId,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
    })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);
  return row ?? null;
}

// --- payments ---------------------------------------------------------------

/**
 * stripePaymentIntentId holds the PaymentIntent id for one-time charges and
 * the Invoice id for subscription cycles — either way it is unique, which
 * makes recording idempotent (duplicates hit onConflictDoNothing).
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
  await db.insert(payments).values(input).onConflictDoNothing();
}

export async function listPaymentsForUser(userId: string, limit = 20): Promise<Payment[]> {
  return db
    .select({
      id: payments.id,
      amountCents: payments.amountCents,
      currency: payments.currency,
      status: payments.status,
      description: payments.description,
      invoiceUrl: payments.invoiceUrl,
      createdAt: payments.createdAt,
    })
    .from(payments)
    .where(eq(payments.userId, userId))
    .orderBy(desc(payments.createdAt))
    .limit(limit);
}

// --- credits ----------------------------------------------------------------

export async function addCredits(userId: string, amountCents: number): Promise<void> {
  await db
    .insert(credits)
    .values({ userId, balanceCents: amountCents })
    .onConflictDoUpdate({
      target: credits.userId,
      set: {
        balanceCents: sql`${credits.balanceCents} + ${amountCents}`,
        updatedAt: new Date(),
      },
    });
}

export async function getCreditsBalance(userId: string): Promise<number> {
  const [row] = await db
    .select({ balanceCents: credits.balanceCents })
    .from(credits)
    .where(eq(credits.userId, userId))
    .limit(1);
  return row?.balanceCents ?? 0;
}
