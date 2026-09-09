import { z } from "zod";

/**
 * Environment variable validation at application startup.
 *
 * The point: a forgotten or empty variable crashes the app IMMEDIATELY with a
 * readable message, instead of a week later in production on the line
 * `undefined is not a function`.
 *
 * Variables of future stages are marked .optional() — they become required as
 * the corresponding modules land.
 */
const schema = z.object({
  // --- application ---
  APP_URL: z.string().url(),
  APP_ENV: z.enum(["development", "preview", "production"]).default("development"),

  // --- authentication (stage 1) ---
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters").optional(),
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),

  // --- email (stage 1) ---
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),

  // --- Stripe (stage 3) ---
  STRIPE_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_SUBSCRIPTION: z.string().optional(),
  STRIPE_PRICE_CREDITS_PACK: z.string().optional(),

  // --- Firebase (data store) ---
  // Base64-encoded service-account JSON. Server-side only.
  FIREBASE_SERVICE_ACCOUNT: z.string().optional(),

  // --- robot backend proxy ---
  DREAM_API_URL: z.string().url().optional(),
  DREAM_API_TOKEN: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((i) => `  ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  throw new Error(
    `Invalid environment variables:\n${details}\n\n` +
      `Check .env.local — use .env.example as the template`,
  );
}

export const env = parsed.data;

/**
 * Disaster guard: a live Stripe key outside production means someone copied
 * production secrets onto their machine. Fail immediately.
 */
if (env.APP_ENV !== "production" && env.STRIPE_SECRET_KEY?.startsWith("sk_live_")) {
  throw new Error(
    "Live Stripe key (sk_live_) detected in a non-production environment. " +
      "Use test keys. If the key got here by accident — roll it in the Stripe Dashboard.",
  );
}
