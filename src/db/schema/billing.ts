/**
 * Биллинг: подписки, платежи, кредиты.
 *
 * Ключевое правило: источник правды о доступе — ЭТИ ТАБЛИЦЫ, которые
 * обновляются вебхуками Stripe. Приложение никогда не ходит в Stripe API,
 * чтобы отрисовать страницу.
 *
 * Все денежные суммы — в минимальных единицах валюты (центах), целыми числами.
 * Числа с плавающей точкой для денег не используем никогда.
 */
import {
  pgTable,
  text,
  uuid,
  timestamp,
  integer,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./users";

/** Статусы подписки — повторяют номенклатуру Stripe. */
export const SUBSCRIPTION_STATUSES = [
  "trialing",
  "active",
  "past_due",
  "canceled",
  "unpaid",
  "incomplete",
] as const;

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    stripeSubscriptionId: text("stripe_subscription_id").notNull(),
    /** Одно из SUBSCRIPTION_STATUSES. */
    status: text("status").notNull(),
    priceId: text("price_id").notNull(),
    /** До какой даты оплачено. Доступ проверяется по этому полю. */
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }).notNull(),
    /** Пользователь нажал «отменить», но доступ сохраняется до конца периода. */
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("subscriptions_stripe_key").on(t.stripeSubscriptionId),
    index("subscriptions_user_idx").on(t.userId),
  ],
);

/**
 * История платежей для вкладки Billing.
 * Наполняется исключительно вебхуками — не при возврате пользователя на сайт.
 */
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    stripePaymentIntentId: text("stripe_payment_intent_id").notNull(),
    /** Сумма в центах. */
    amountCents: integer("amount_cents").notNull(),
    currency: text("currency").notNull().default("usd"),
    status: text("status").notNull(),
    description: text("description"),
    /** Ссылка на PDF-счёт, который выдаёт Stripe. Свои счета не генерируем. */
    invoiceUrl: text("invoice_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("payments_stripe_key").on(t.stripePaymentIntentId),
    index("payments_user_created_idx").on(t.userId, t.createdAt),
  ],
);

/**
 * Баланс предоплаченных кредитов для оплаты вызовов API.
 *
 * Предоплата, а не постоплата: клиент не может нагенерить счёт на тысячи
 * долларов и не заплатить — GPU-время к тому моменту уже потрачено.
 */
export const credits = pgTable("credits", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  balanceCents: integer("balance_cents").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Журнал обработанных вебхуков Stripe.
 *
 * Stripe гарантирует доставку «хотя бы один раз», то есть одно событие может
 * прийти дважды. Уникальный ключ по event_id делает обработку идемпотентной:
 * повторное событие просто не пройдёт вставку.
 */
export const processedEvents = pgTable(
  "processed_events",
  {
    stripeEventId: text("stripe_event_id").primaryKey(),
    type: text("type").notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }).notNull().defaultNow(),
  },
);
