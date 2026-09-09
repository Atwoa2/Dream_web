import { z } from "zod";

/**
 * Валидация переменных окружения при старте приложения.
 *
 * Смысл: если переменная забыта или пустая, приложение падает СРАЗУ с внятным
 * сообщением, а не через неделю в проде на строке `undefined is not a function`.
 *
 * Переменные будущих этапов помечены .optional() — их добавим по мере готовности
 * соответствующих модулей.
 */
const schema = z.object({
  // --- приложение ---
  APP_URL: z.string().url(),
  APP_ENV: z.enum(["development", "preview", "production"]).default("development"),

  // --- база данных ---
  DATABASE_URL: z.string().min(1, "DATABASE_URL обязателен"),

  // --- аутентификация (этап 1) ---
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET должен быть не короче 32 символов").optional(),
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),

  // --- почта (этап 1) ---
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),

  // --- Stripe (этап 3) ---
  STRIPE_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_SUBSCRIPTION: z.string().optional(),
  STRIPE_PRICE_CREDITS_PACK: z.string().optional(),

  // --- rate limiting (этап 1) ---
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((i) => `  ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  throw new Error(
    `Некорректные переменные окружения:\n${details}\n\n` +
      `Проверь .env.local — за образец возьми .env.example`,
  );
}

export const env = parsed.data;

/**
 * Защита от катастрофы: боевой ключ Stripe вне прода означает, что кто-то
 * скопировал прод-секреты себе на машину. Падаем немедленно.
 */
if (env.APP_ENV !== "production" && env.STRIPE_SECRET_KEY?.startsWith("sk_live_")) {
  throw new Error(
    "В непроизводственном окружении обнаружен боевой ключ Stripe (sk_live_). " +
      "Используй test-ключи. Если ключ попал сюда случайно — отзови его в Stripe Dashboard.",
  );
}
