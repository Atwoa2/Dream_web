/**
 * The Stripe webhook endpoint — the single entry point for billing truth.
 *
 * The signature is verified against the RAW body: parsing JSON first breaks
 * verification and, worse, accepting unverified payloads would let anyone
 * "confirm" their own payment.
 */
import { NextResponse } from "next/server";
import { handleWebhookEvent, stripe } from "@/modules/billing";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    logger.error("webhook: STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "not configured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing signature" }, { status: 400 });
  }

  const rawBody = await request.text();

  let event;
  try {
    event = await stripe().webhooks.constructEventAsync(
      rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    logger.warn("webhook: signature verification failed");
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  try {
    await handleWebhookEvent(event);
    return NextResponse.json({ received: true });
  } catch (error) {
    // 500 → Stripe retries with backoff. Handlers are idempotent, so a
    // partial failure is safe to re-run.
    logger.error("webhook: handler failed", {
      eventId: event.id,
      type: event.type,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "handler failed" }, { status: 500 });
  }
}
