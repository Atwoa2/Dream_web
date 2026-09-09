/**
 * Пользователи и аутентификация.
 *
 * Паролей в системе нет: вход только по одноразовому коду на email или через
 * Google. Хранить нечего — красть нечего.
 */
import {
  pgTable,
  text,
  uuid,
  timestamp,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    /** Момент подтверждения email. null = ещё не подтверждён. */
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    name: text("name"),
    avatarUrl: text("avatar_url"),
    /** Идентификатор Customer в Stripe (cus_...). Связка с биллингом. */
    stripeCustomerId: text("stripe_customer_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("users_email_key").on(t.email),
    uniqueIndex("users_stripe_customer_key").on(t.stripeCustomerId),
  ],
);

/**
 * Привязки внешних провайдеров (Google).
 * Один пользователь может иметь несколько привязок — вход по email и через
 * Google с тем же адресом ведут в ОДИН аккаунт, а не в два разных.
 */
export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("accounts_provider_key").on(t.provider, t.providerAccountId),
    index("accounts_user_idx").on(t.userId),
  ],
);

/** Активные сессии. Токен хранится хэшем — утечка таблицы не даёт войти. */
export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("sessions_token_key").on(t.tokenHash),
    index("sessions_user_idx").on(t.userId),
  ],
);

/**
 * Одноразовые коды для входа по email.
 *
 * Хранится ХЭШ кода, не сам код. Счётчик попыток защищает от перебора:
 * 6 цифр — это миллион вариантов, без лимита они подбираются за минуты.
 */
export const emailOtp = pgTable(
  "email_otp",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    codeHash: text("code_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    attempts: integer("attempts").notNull().default(0),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("email_otp_email_idx").on(t.email)],
);
