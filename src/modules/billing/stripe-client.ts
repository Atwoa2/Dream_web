/**
 * The Stripe SDK instance. The ONLY file in the codebase that constructs it —
 * everything Stripe-related flows through the billing module.
 */
import Stripe from "stripe";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";

let client: Stripe | null = null;

export function stripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new AppError("INTERNAL", "Stripe is not configured");
  }
  client ??= new Stripe(env.STRIPE_SECRET_KEY);
  return client;
}
